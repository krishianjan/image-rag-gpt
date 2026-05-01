import uuid
from typing import Any

from app.models.documents import DocumentStatus
from app.workers.celery_app import celery_app


def _get_db():
    from app.database_sync import SyncSessionLocal
    return SyncSessionLocal()


def _set_status(db, doc_id: str, status: DocumentStatus):
    from sqlalchemy import update
    from app.models.documents import Document
    db.execute(update(Document).where(Document.id == uuid.UUID(doc_id)).values(status=status))
    db.commit()


def _get_embedder():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def _chunk_toon_objects(text_elements: list[dict], max_tokens: int = 512) -> list[dict]:
    """Group TOON objects into chunks without splitting mid-object."""
    chunks, current, current_len = [], [], 0
    for el in text_elements:
        text = el.get("text", "")
        tlen = len(text.split())
        if current and current_len + tlen > max_tokens:
            chunks.append(current)
            current, current_len = [], 0
        current.append(el)
        current_len += tlen
    if current:
        chunks.append(current)
    return chunks


def _build_chunk_text(toon_group: list[dict]) -> tuple[str, list[Any], int | None]:
    texts, bboxes, page = [], [], None
    for el in toon_group:
        texts.append(el["text"])
        if el.get("bboxes"):
            bboxes.extend(el["bboxes"])
            if page is None and el["bboxes"]:
                page = el["bboxes"][0].get("page")
    return "\n".join(texts), bboxes, page


def _summarize_chunks(chunks_text: list[str], doc_id: str) -> str:
    """Use Groq to summarize a group of chunks into a parent node."""
    try:
        from groq import Groq
        from app.config import settings
        client = Groq(api_key=settings.GROQ_API_KEY)
        joined = "\n\n---\n\n".join(chunks_text[:8])
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{
                "role": "user",
                "content": f"Summarize these document sections in 3-5 sentences. Be factual, no commentary:\n\n{joined}"
            }],
            max_tokens=300,
            temperature=0.1,
        )
        return resp.choices[0].message.content.strip()
    except Exception:
        return " ".join(chunks_text[:3])[:500]


@celery_app.task(
    name="app.workers.tasks.embed.embed_chunks_task",
    bind=True,
    max_retries=2,
    default_retry_delay=30,
    queue="slow_queue",
)
def embed_chunks_task(self, doc_id: str, tenant_id: str):
    db = _get_db()
    try:
        from app.models.documents import Document, DocumentChunk, DocumentMetadata
        from sqlalchemy import select, delete

        _set_status(db, doc_id, DocumentStatus.EMBEDDING)

        meta = db.query(DocumentMetadata).filter_by(doc_id=uuid.UUID(doc_id)).first()
        if not meta or not meta.structured_json:
            raise ValueError("No structured_json found — run parse first")

        text_elements = meta.structured_json.get("text_elements", [])
        if not text_elements:
            raise ValueError("No text elements found in structured_json")

        # Clear existing chunks for idempotency
        db.execute(delete(DocumentChunk).where(DocumentChunk.doc_id == uuid.UUID(doc_id)))
        db.commit()

        embedder = _get_embedder()

        # --- LEAF LAYER: chunk by TOON objects ---
        toon_groups = _chunk_toon_objects(text_elements, max_tokens=512)
        leaf_ids: list[uuid.UUID] = []
        leaf_texts: list[str] = []

        for idx, group in enumerate(toon_groups):
            text, bboxes, page = _build_chunk_text(group)
            if not text.strip():
                continue
            embedding = embedder.encode(text, normalize_embeddings=True).tolist()
            chunk = DocumentChunk(
                doc_id=uuid.UUID(doc_id),
                tenant_id=uuid.UUID(tenant_id),
                chunk_index=idx,
                content=text,
                page_num=page,
                bbox=bboxes[0]["bbox"] if bboxes else None,
                chunk_metadata={"layer": "leaf", "toon_count": len(group)},
                embedding=embedding,
                is_summary=False,
                parent_chunk_id=None,
            )
            db.add(chunk)
            db.flush()
            leaf_ids.append(chunk.id)
            leaf_texts.append(text)

        db.commit()

        # --- SECTION LAYER: group 5 leaves → 1 section summary ---
        section_ids: list[uuid.UUID] = []
        section_texts: list[str] = []
        group_size = 5

        for i in range(0, len(leaf_ids), group_size):
            group_texts = leaf_texts[i:i + group_size]
            group_leaf_ids = leaf_ids[i:i + group_size]
            if not group_texts:
                continue

            summary_text = _summarize_chunks(group_texts, doc_id)
            embedding = embedder.encode(summary_text, normalize_embeddings=True).tolist()

            section_chunk = DocumentChunk(
                doc_id=uuid.UUID(doc_id),
                tenant_id=uuid.UUID(tenant_id),
                chunk_index=10000 + i,
                content=summary_text,
                page_num=None,
                bbox=None,
                chunk_metadata={"layer": "section", "leaf_ids": [str(lid) for lid in group_leaf_ids]},
                embedding=embedding,
                is_summary=True,
                parent_chunk_id=None,
            )
            db.add(section_chunk)
            db.flush()

            # Link leaves to this section parent
            from sqlalchemy import update
            db.execute(
                update(DocumentChunk)
                .where(DocumentChunk.id.in_(group_leaf_ids))
                .values(parent_chunk_id=section_chunk.id)
            )
            section_ids.append(section_chunk.id)
            section_texts.append(summary_text)

        db.commit()

        # --- DOC LAYER: single document summary ---
        if section_texts:
            doc_summary = _summarize_chunks(section_texts, doc_id)
            embedding = embedder.encode(doc_summary, normalize_embeddings=True).tolist()
            doc_chunk = DocumentChunk(
                doc_id=uuid.UUID(doc_id),
                tenant_id=uuid.UUID(tenant_id),
                chunk_index=99999,
                content=doc_summary,
                page_num=None,
                bbox=None,
                chunk_metadata={"layer": "document", "section_ids": [str(s) for s in section_ids]},
                embedding=embedding,
                is_summary=True,
                parent_chunk_id=None,
            )
            db.add(doc_chunk)
            db.flush()

            from sqlalchemy import update
            db.execute(
                update(DocumentChunk)
                .where(DocumentChunk.id.in_(section_ids))
                .values(parent_chunk_id=doc_chunk.id)
            )

        db.commit()

        # Update document status → READY
        from sqlalchemy import update
        # Chain: trigger extraction after embedding
        from app.workers.tasks.extract import extract_document_task
        extract_document_task.apply_async(
            kwargs={"doc_id": doc_id, "tenant_id": tenant_id},
            queue="slow_queue",
        )

        db.execute(
            update(Document)
            .where(Document.id == uuid.UUID(doc_id))
            .values(status=DocumentStatus.READY)
        )
        db.commit()

    except Exception as exc:
        db.rollback()
        _set_status(db, doc_id, DocumentStatus.FAILED)
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(
    name="app.workers.tasks.embed._trigger_extract",
    queue="slow_queue",
)
def _trigger_extract(doc_id: str, tenant_id: str):
    from app.workers.tasks.extract import extract_document_task
    extract_document_task.apply_async(
        kwargs={"doc_id": doc_id, "tenant_id": tenant_id},
        queue="slow_queue",
    )