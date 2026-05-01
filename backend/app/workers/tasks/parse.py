import os
import re
import uuid
from collections import Counter
from pathlib import Path
from typing import Any

from app.config import settings
from app.models.documents import DocumentStatus, DocumentType
from app.workers.celery_app import celery_app

IMAGE_MIMES = {"image/png", "image/jpeg", "image/tiff", "image/webp", "image/jpg"}


def _get_db():
    from app.database_sync import SyncSessionLocal
    return SyncSessionLocal()


def _set_status(db, doc_id: str, status: DocumentStatus, error: str | None = None):
    from sqlalchemy import update
    from app.models.documents import Document
    vals: dict[str, Any] = {"status": status}
    if error:
        vals["error_message"] = error[:2000]
    db.execute(update(Document).where(Document.id == uuid.UUID(doc_id)).values(**vals))
    db.commit()


def _classify_text(text: str) -> DocumentType:
    t = text[:3000].lower()
    if any(k in t for k in ["invoice", "bill to", "amount due", "invoice no", "invoice #"]):
        return DocumentType.INVOICE
    if any(k in t for k in ["agreement", "contract", "whereas", "party a", "terms and conditions"]):
        return DocumentType.CONTRACT
    if any(k in t for k in ["claim", "patient", "diagnosis", "icd-", "npi", "prescription", "dosage", "mg", "tablet", "rx"]):
        return DocumentType.HEALTHCARE_CLAIM
    if any(k in t for k in ["court", "plaintiff", "defendant", "hereby", "jurisdiction"]):
        return DocumentType.LEGAL
    return DocumentType.GENERIC


def _extract_keywords(text: str, top_n: int = 50) -> dict[str, int]:
    STOP = {
        "the","a","an","and","or","but","in","on","at","to","for","of","with","by",
        "from","is","are","was","were","be","been","have","has","had","do","does",
        "did","will","would","could","should","may","might","not","this","that",
        "it","its","as","if","so","all","any","some","no","up","out","s","t",
    }
    tokens = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    return dict(Counter(t for t in tokens if t not in STOP).most_common(top_n))


def _parse_image_with_gemini(local_path: str, mime_type: str) -> str:
    """Primary: Gemini 1.5 Flash — best vision accuracy, 1M tokens/day free."""
    import google.generativeai as genai
    import PIL.Image
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel(
        "gemini-1.5-flash",
        generation_config={"max_output_tokens": 4096, "temperature": 0.0},
    )
    img = PIL.Image.open(local_path)
    resp = model.generate_content([
        """You are an expert document OCR and analysis system. Extract ALL text from this image with maximum accuracy.
Then provide:
1. Complete verbatim text extraction preserving layout
2. Document type detection
3. All key fields (names, dates, amounts, drug names/dosages if medical, parties if legal)
4. A 2-3 sentence professional summary

Format your response as:
=== EXTRACTED TEXT ===
[full text here]

=== KEY FIELDS ===
[structured fields]

=== SUMMARY ===
[professional summary]""",
        img,
    ])
    return resp.text or ""


def _parse_image_with_groq_fallback(local_path: str, mime_type: str) -> str:
    """Fallback: Groq with current active vision model."""
    import base64
    from groq import Groq

    # Use meta-llama/llama-4-scout-17b-16e-instruct — current Groq vision model
    GROQ_VISION_MODELS = [
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "meta-llama/llama-4-maverick-17b-128e-instruct",
    ]

    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    with open(local_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()

    for model in GROQ_VISION_MODELS:
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
                        {"type": "text", "text": "Extract ALL text from this image accurately. Identify document type and key fields (names, dates, amounts, medications, dosages if present). Provide a brief professional summary."},
                    ],
                }],
                max_tokens=2048,
                temperature=0.0,
            )
            return resp.choices[0].message.content or ""
        except Exception as e:
            if "decommissioned" in str(e).lower() or "not found" in str(e).lower():
                continue
            raise
    return ""


def _parse_image(local_path: str, mime_type: str) -> dict[str, Any]:
    """Try Gemini first (best accuracy), then Groq, then raise."""
    extracted_text = ""

    # 1. Try Gemini (primary — best accuracy, handles handwriting well)
    try:
        if os.environ.get("GEMINI_API_KEY"):
            extracted_text = _parse_image_with_gemini(local_path, mime_type)
    except Exception as e:
        pass

    # 2. Try Groq vision (fallback)
    if not extracted_text or len(extracted_text.strip()) < 20:
        try:
            if os.environ.get("GROQ_API_KEY"):
                extracted_text = _parse_image_with_groq_fallback(local_path, mime_type)
        except Exception:
            pass

    if not extracted_text or len(extracted_text.strip()) < 5:
        raise RuntimeError("All vision models failed to extract text. Check GEMINI_API_KEY and GROQ_API_KEY.")

    return {
        "raw_text": extracted_text,
        "text_elements": [{"text": extracted_text, "type": "vision_extract", "bboxes": []}],
        "page_count": 1,
        "page_metadata": [{"page": 1, "width_pts": 612, "height_pts": 792}],
        "tables": [],
        "markdown_output": extracted_text,
    }


def _parse_document_with_docling(local_path: str) -> dict[str, Any]:
    from docling.document_converter import DocumentConverter
    converter = DocumentConverter()
    result = converter.convert(local_path)
    doc_obj = result.document

    try:
        markdown_output = doc_obj.export_to_markdown()
    except Exception:
        markdown_output = None

    pages_meta = {}
    for page_no, page_item in (doc_obj.pages or {}).items():
        pw = float(page_item.size.width) if page_item.size else 612.0
        ph = float(page_item.size.height) if page_item.size else 792.0
        pages_meta[int(page_no)] = {"width_pts": pw, "height_pts": ph}

    text_elements, full_text_parts = [], []
    for item, _ in doc_obj.iterate_items():
        text = getattr(item, "text", None)
        if not text:
            continue
        full_text_parts.append(text)
        provs = getattr(item, "prov", [])
        boxes = []
        for prov in provs:
            if not prov.bbox:
                continue
            page_no = int(prov.page_no)
            page_info = pages_meta.get(page_no, {"width_pts": 612.0, "height_pts": 792.0})
            pw, ph = page_info["width_pts"], page_info["height_pts"]
            try:
                from docling.datamodel.base_models import CoordOrigin
                if prov.bbox.coord_origin == CoordOrigin.BOTTOMLEFT:
                    y0 = 1.0 - (prov.bbox.b / ph) if ph else 0.0
                    y1 = 1.0 - (prov.bbox.t / ph) if ph else 0.0
                else:
                    y0 = prov.bbox.t / ph if ph else 0.0
                    y1 = prov.bbox.b / ph if ph else 0.0
                boxes.append({"page": page_no, "bbox": {
                    "x0": round(prov.bbox.l / pw, 6) if pw else 0.0,
                    "y0": round(y0, 6), "x1": round(prov.bbox.r / pw, 6) if pw else 1.0,
                    "y1": round(y1, 6),
                }})
            except Exception:
                pass
        text_elements.append({"text": text, "type": type(item).__name__, "bboxes": boxes})

    tables_data = []
    for table in (getattr(doc_obj, "tables", None) or []):
        try:
            tables_data.append({
                "data": table.export_to_dataframe().to_dict(orient="records") if hasattr(table, "export_to_dataframe") else []
            })
        except Exception:
            pass

    return {
        "raw_text": "\n".join(full_text_parts),
        "text_elements": text_elements,
        "page_count": len(pages_meta),
        "page_metadata": [{"page": k, **v} for k, v in pages_meta.items()],
        "tables": tables_data,
        "markdown_output": markdown_output,
    }


@celery_app.task(
    name="app.workers.tasks.parse.parse_document_task",
    bind=True, max_retries=2, default_retry_delay=30, queue="slow_queue",
)
def parse_document_task(self, doc_id: str, file_path: str, tenant_id: str, mime_type: str):
    local_path = None
    db = _get_db()
    try:
        _set_status(db, doc_id, DocumentStatus.PROCESSING)

        from app.services import storage
        suffix = Path(file_path).suffix or (".jpg" if "image" in mime_type else ".pdf")
        local_path = storage.download_to_tmp(file_path, uuid.UUID(doc_id), suffix)

        is_image = mime_type in IMAGE_MIMES
        parsed = _parse_image(local_path, mime_type) if is_image else _parse_document_with_docling(local_path)

        full_text = parsed["raw_text"]
        text_elements = parsed["text_elements"]
        keyword_freq = _extract_keywords(full_text)
        doc_type = _classify_text(full_text)

        try:
            import spacy
            nlp = spacy.load("en_core_web_sm")
            spacy_doc = nlp(full_text[:100000])
            entity_map: dict[str, list[str]] = {}
            for ent in spacy_doc.ents:
                entity_map.setdefault(ent.label_, [])
                if ent.text not in entity_map[ent.label_]:
                    entity_map[ent.label_].append(ent.text)
        except Exception:
            entity_map = {}

        from sqlalchemy import update
        from app.models.documents import Document, DocumentMetadata

        db.execute(
            update(Document).where(Document.id == uuid.UUID(doc_id)).values(
                status=DocumentStatus.PARSED,
                doc_type=doc_type,
                page_count=parsed.get("page_count", 1),
                word_count=len(full_text.split()),
                error_message=None,
            )
        )

        existing = db.query(DocumentMetadata).filter_by(doc_id=uuid.UUID(doc_id)).first()
        meta_data = dict(
            doc_id=uuid.UUID(doc_id), tenant_id=uuid.UUID(tenant_id),
            raw_text=full_text,
            structured_json={"text_elements": text_elements, "page_count": parsed.get("page_count", 1)},
            bounding_boxes=[e["bboxes"] for e in text_elements],
            keyword_freq=keyword_freq, entity_map=entity_map,
            page_metadata=parsed.get("page_metadata", [{"page": 1, "width_pts": 612, "height_pts": 792}]),
            tables=parsed.get("tables", []),
            markdown_output=parsed.get("markdown_output"),
        )
        if existing:
            for k, v in meta_data.items():
                setattr(existing, k, v)
        else:
            db.add(DocumentMetadata(**meta_data))

        db.commit()

        from app.workers.tasks.embed import embed_chunks_task
        embed_chunks_task.apply_async(
            kwargs={"doc_id": doc_id, "tenant_id": tenant_id},
            queue="slow_queue",
        )

    except Exception as exc:
        db.rollback()
        _set_status(db, doc_id, DocumentStatus.FAILED, str(exc))
        raise self.retry(exc=exc)
    finally:
        db.close()
        if local_path and os.path.exists(local_path):
            try:
                os.remove(local_path)
            except OSError:
                pass


@celery_app.task(
    name="app.workers.tasks.parse.classify_document_task",
    bind=True, max_retries=1, queue="fast_queue",
)
def classify_document_task(self, doc_id: str, text_preview: str):
    db = _get_db()
    try:
        from sqlalchemy import update
        from app.models.documents import Document
        db.execute(
            update(Document).where(Document.id == uuid.UUID(doc_id))
            .values(doc_type=_classify_text(text_preview))
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc)
    finally:
        db.close()