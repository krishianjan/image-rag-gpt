import uuid
from typing import Any

from app.models.documents import DocumentStatus
from app.workers.celery_app import celery_app


def _get_db():
    from app.database_sync import SyncSessionLocal
    return SyncSessionLocal()


def _build_dynamic_model(schema_def: dict) -> type:
    """Build a Pydantic model at runtime from user's schema definition."""
    from pydantic import BaseModel, Field
    import typing

    TYPE_MAP = {
        "string": str,
        "number": float,
        "integer": int,
        "boolean": bool,
        "array": list[str],
    }

    fields = {}
    for field in schema_def.get("fields", []):
        key = field["key"]
        python_type = TYPE_MAP.get(field.get("type", "string"), str)
        desc = field.get("description", key)
        fields[key] = (python_type | None, Field(default=None, description=desc))

    return type("DynamicExtraction", (BaseModel,), {"__annotations__": {k: v[0] for k, v in fields.items()}, **{k: v[1] for k, v in fields.items()}})


def _ground_check(extracted: dict, text: str) -> dict[str, bool]:
    """Verify each string value exists verbatim in source text."""
    grounding = {}
    for key, val in extracted.items():
        if isinstance(val, str) and val:
            grounding[key] = val.lower() in text.lower()
        else:
            grounding[key] = val is not None
    return grounding


def _confidence_scores(extracted: dict, grounding: dict) -> dict[str, float]:
    scores = {}
    for key, val in extracted.items():
        if val is None:
            scores[key] = 0.0
        elif grounding.get(key):
            scores[key] = 0.95
        else:
            scores[key] = 0.4
    return scores


def _extract_with_schema(markdown: str, schema_def: dict, max_retries: int = 2) -> tuple[dict, str]:
    import instructor
    from groq import Groq
    from app.config import settings

    client = instructor.from_groq(Groq(api_key=settings.GROQ_API_KEY), mode=instructor.Mode.JSON)
    DynamicModel = _build_dynamic_model(schema_def)

    field_descriptions = "\n".join(
        f"- {f['key']} ({f.get('type','string')}): {f.get('description','')}"
        for f in schema_def.get("fields", [])
    )

    prompt = f"""Extract the following fields from this document. Only extract values that are explicitly present in the text. If a value is not found, return null.

Fields to extract:
{field_descriptions}

Document:
{markdown[:6000]}"""

    model_used = "llama-3.1-8b-instant"
    try:
        result = client.chat.completions.create(
            model=model_used,
            response_model=DynamicModel,
            messages=[{"role": "user", "content": prompt}],
            max_retries=max_retries,
            temperature=0.0,
        )
        return result.model_dump(), model_used
    except Exception:
        # Fallback to stronger model on failure
        model_used = "llama-3.3-70b-versatile"
        result = client.chat.completions.create(
            model=model_used,
            response_model=DynamicModel,
            messages=[{"role": "user", "content": prompt}],
            max_retries=1,
            temperature=0.0,
        )
        return result.model_dump(), model_used


def _extract_intelligence(markdown: str) -> dict[str, Any]:
    """Extract summary, key findings, key points, ignore points via Groq."""
    from groq import Groq
    from app.config import settings
    import json

    client = Groq(api_key=settings.GROQ_API_KEY)
    prompt = f"""Analyze this document and return ONLY valid JSON with these exact keys:
{{
  "summary": "2-3 sentence summary",
  "key_findings": ["finding1", "finding2"],
  "key_points": ["point1", "point2"],
  "ignore_points": ["noise or boilerplate to ignore"]
}}

Document:
{markdown[:5000]}"""

    resp = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800,
        temperature=0.1,
        response_format={"type": "json_object"},
    )
    try:
        return json.loads(resp.choices[0].message.content)
    except Exception:
        return {"summary": None, "key_findings": [], "key_points": [], "ignore_points": []}


@celery_app.task(
    name="app.workers.tasks.extract.extract_document_task",
    bind=True,
    max_retries=2,
    default_retry_delay=60,
    queue="slow_queue",
)
def extract_document_task(self, doc_id: str, tenant_id: str):
    db = _get_db()
    try:
        from sqlalchemy import update
        from app.models.documents import Document, DocumentMetadata, DocumentExtraction, ExtractionSchema

        _set_status(db, doc_id, DocumentStatus.EXTRACTING)

        meta = db.query(DocumentMetadata).filter_by(doc_id=uuid.UUID(doc_id)).first()
        if not meta:
            raise ValueError("No metadata found")

        source_text = meta.markdown_output or meta.raw_text or ""

        # Always run intelligence extraction
        intelligence = _extract_intelligence(source_text)

        # Schema extraction if schema attached
        extracted_json, confidence, grounding = None, None, None
        doc = db.query(Document).filter_by(id=uuid.UUID(doc_id)).first()

        if doc and doc.schema_id:
            schema_rec = db.query(ExtractionSchema).filter_by(id=doc.schema_id).first()
            if schema_rec:
                extracted_json, _ = _extract_with_schema(source_text, schema_rec.schema_def)
                grounding = _ground_check(extracted_json, source_text)
                confidence = _confidence_scores(extracted_json, grounding)

        existing = db.query(DocumentExtraction).filter_by(doc_id=uuid.UUID(doc_id)).first()
        if existing:
            existing.extracted_json = extracted_json
            existing.confidence_scores = confidence
            existing.grounding_map = grounding
            existing.summary = intelligence.get("summary")
            existing.key_findings = intelligence.get("key_findings", [])
            existing.key_points = intelligence.get("key_points", [])
            existing.ignore_points = intelligence.get("ignore_points", [])
        else:
            db.add(DocumentExtraction(
                doc_id=uuid.UUID(doc_id),
                tenant_id=uuid.UUID(tenant_id),
                schema_id=doc.schema_id if doc else None,
                extracted_json=extracted_json,
                confidence_scores=confidence,
                grounding_map=grounding,
                summary=intelligence.get("summary"),
                key_findings=intelligence.get("key_findings", []),
                key_points=intelligence.get("key_points", []),
                ignore_points=intelligence.get("ignore_points", []),
            ))

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


def _set_status(db, doc_id: str, status: DocumentStatus):
    from sqlalchemy import update
    from app.models.documents import Document
    db.execute(update(Document).where(Document.id == uuid.UUID(doc_id)).values(status=status))
    db.commit()