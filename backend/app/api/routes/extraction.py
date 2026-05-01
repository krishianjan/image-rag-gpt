import uuid
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from app.api.deps import DBDep, TenantDep
from app.models.documents import ExtractionSchema, DocumentExtraction, Document
from app.schemas.documents import ExtractionSchemaCreate, ExtractionSchemaOut
from pydantic import BaseModel
from typing import Any
from datetime import datetime

router = APIRouter(prefix="/extraction", tags=["extraction"])

class DocumentExtractionOut(BaseModel):
    doc_id: uuid.UUID
    extracted_json: dict[str, Any] | None
    confidence_scores: dict[str, float] | None
    grounding_map: dict[str, bool] | None
    summary: str | None
    key_findings: list[str]
    key_points: list[str]
    created_at: datetime

@router.post("/schemas", response_model=ExtractionSchemaOut, status_code=status.HTTP_201_CREATED)
async def create_schema(body: ExtractionSchemaCreate, db: DBDep, tenant_id: TenantDep):
    schema = ExtractionSchema(
        name=body.name,
        tenant_id=tenant_id,
        schema_def=body.schema_def
    )
    db.add(schema)
    await db.flush()
    await db.refresh(schema)
    return schema

@router.get("/schemas", response_model=list[ExtractionSchemaOut])
async def list_schemas(db: DBDep, tenant_id: TenantDep):
    result = await db.execute(select(ExtractionSchema).where(ExtractionSchema.tenant_id == tenant_id))
    return result.scalars().all()

@router.get("/{doc_id}", response_model=DocumentExtractionOut)
async def get_extraction(doc_id: uuid.UUID, db: DBDep, tenant_id: TenantDep):
    result = await db.execute(
        select(DocumentExtraction).where(
            DocumentExtraction.doc_id == doc_id,
            DocumentExtraction.tenant_id == tenant_id
        )
    )
    ext = result.scalar_one_or_none()
    if not ext:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Extraction not found or not complete")
    
    return DocumentExtractionOut(
        doc_id=ext.doc_id,
        extracted_json=ext.extracted_json,
        confidence_scores=ext.confidence_scores,
        grounding_map=ext.grounding_map,
        summary=ext.summary,
        key_findings=ext.key_findings,
        key_points=ext.key_points,
        created_at=ext.created_at
    )

@router.post("/{doc_id}/link-schema/{schema_id}")
async def link_schema(doc_id: uuid.UUID, schema_id: uuid.UUID, db: DBDep, tenant_id: TenantDep):
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.tenant_id == tenant_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    doc.schema_id = schema_id
    await db.commit()
    return {"message": "Schema linked successfully"}
