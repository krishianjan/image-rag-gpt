import json
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, text

from app.api.deps import DBDep, TenantDep
from app.models.documents import AgentMessage, AgentRole, AgentSession, Document, DocumentStatus
from app.services.model_router import build_rag_messages, stream_complete

router = APIRouter(prefix="", tags=["agent"])


class ChatRequest(BaseModel):
    doc_id: uuid.UUID
    question: str
    session_id: uuid.UUID | None = None
    model_preference: str = "auto"  # groq | gemini | qwen | auto


def _hybrid_retrieve(doc_id: str, tenant_id: str, query: str, db_sync) -> list[dict]:
    from sentence_transformers import SentenceTransformer
    embedding = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2").encode(
        query, normalize_embeddings=True
    ).tolist()
    emb_str = "[" + ",".join(str(v) for v in embedding) + "]"

    rows = db_sync.execute(text(f"""
        WITH dense AS (
            SELECT id, content, page_num, bbox, chunk_metadata,
                   ROW_NUMBER() OVER (ORDER BY embedding <=> '{emb_str}'::vector) AS rank
            FROM document_chunks
            WHERE doc_id = :doc_id AND tenant_id = :tenant_id
              AND embedding IS NOT NULL AND is_summary = false
            LIMIT 20
        ),
        bm25 AS (
            SELECT id, content, page_num, bbox, chunk_metadata,
                   ROW_NUMBER() OVER (ORDER BY similarity(content, :query) DESC) AS rank
            FROM document_chunks
            WHERE doc_id = :doc_id AND tenant_id = :tenant_id
              AND is_summary = false
            LIMIT 20
        )
        SELECT COALESCE(d.id, b.id) AS id,
               COALESCE(d.content, b.content) AS content,
               COALESCE(d.page_num, b.page_num) AS page_num,
               COALESCE(d.bbox, b.bbox) AS bbox,
               (1.0/COALESCE(d.rank+60,61)) + (1.0/COALESCE(b.rank+60,61)) AS rrf_score
        FROM dense d FULL OUTER JOIN bm25 b ON d.id = b.id
        ORDER BY rrf_score DESC
        LIMIT 8
    """), {"doc_id": doc_id, "tenant_id": tenant_id, "query": query}).fetchall()

    return [
        {"content": r.content, "page_num": r.page_num, "bbox": r.bbox, "score": float(r.rrf_score)}
        for r in rows
    ]


async def _event_stream(
    question: str,
    chunks: list[dict],
    history: list[dict],
    model_preference: str,
) -> AsyncGenerator[str, None]:
    sources = [{"page": c["page_num"], "bbox": c["bbox"]} for c in chunks if c["page_num"]]
    yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

    messages = build_rag_messages(question, chunks, history)

    full_text: list[str] = []
    try:
        for token in stream_complete(messages, max_tokens=1024, model_preference=model_preference):
            full_text.append(token)
            yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"
    except RuntimeError as exc:
        yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
        return

    yield f"data: {json.dumps({'type': 'done', 'full_text': ''.join(full_text)})}\n\n"


@router.post("/chat")
async def chat(body: ChatRequest, db: DBDep, tenant_id: TenantDep):
    result = await db.execute(
        select(Document).where(Document.id == body.doc_id, Document.tenant_id == tenant_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.status not in (DocumentStatus.READY, DocumentStatus.PARSED, DocumentStatus.EMBEDDING, DocumentStatus.EXTRACTING):
        raise HTTPException(status_code=status.HTTP_425_TOO_EARLY, detail=f"Status: {doc.status}")

    if body.session_id:
        sess_result = await db.execute(
            select(AgentSession).where(
                AgentSession.id == body.session_id, AgentSession.tenant_id == tenant_id
            )
        )
        session = sess_result.scalar_one_or_none()
    else:
        session = None

    if not session:
        session = AgentSession(doc_id=body.doc_id, tenant_id=tenant_id)
        db.add(session)
        await db.flush()

    db.add(AgentMessage(
        session_id=session.id, tenant_id=tenant_id,
        role=AgentRole.USER, content=body.question,
    ))
    await db.flush()
    session_id = session.id

    # Build conversation history for context
    history_result = await db.execute(
        select(AgentMessage)
        .where(AgentMessage.session_id == session_id)
        .order_by(AgentMessage.created_at.asc())
        .limit(10)
    )
    history = [
        {"role": m.role.value, "content": m.content}
        for m in history_result.scalars().all()
        if m.content
    ]

    from app.database_sync import SyncSessionLocal
    sync_db = SyncSessionLocal()
    try:
        chunks = _hybrid_retrieve(str(body.doc_id), str(tenant_id), body.question, sync_db)
    finally:
        sync_db.close()

    async def streamer():
        full_text: list[str] = []
        async for event in _event_stream(body.question, chunks, history, body.model_preference):
            yield event
            if '"type": "done"' in event:
                try:
                    data = json.loads(event.replace("data: ", ""))
                    full_text = [data.get("full_text", "")]
                except Exception:
                    pass
        async with db:
            db.add(AgentMessage(
                session_id=session_id, tenant_id=tenant_id,
                role=AgentRole.ASSISTANT, content="".join(full_text),
                sources=[{"page": c["page_num"], "bbox": c["bbox"]} for c in chunks],
            ))
            await db.commit()

    return StreamingResponse(
        streamer(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "X-Session-Id": str(session_id),
        },
    )


@router.get("/extraction/{doc_id}")
async def get_extraction(doc_id: uuid.UUID, db: DBDep, tenant_id: TenantDep):
    from app.models.documents import DocumentExtraction
    result = await db.execute(
        select(DocumentExtraction).where(
            DocumentExtraction.doc_id == doc_id,
            DocumentExtraction.tenant_id == tenant_id,
        )
    )
    ext = result.scalar_one_or_none()
    if not ext:
        raise HTTPException(status_code=404, detail="Extraction not found")
    return {
        "doc_id": doc_id,
        "summary": ext.summary,
        "key_findings": ext.key_findings,
        "key_points": ext.key_points,
        "ignore_points": ext.ignore_points,
        "extracted_json": ext.extracted_json,
        "confidence_scores": ext.confidence_scores,
        "grounding_map": ext.grounding_map,
    }