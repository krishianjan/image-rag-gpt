import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DBDep, TenantDep
from app.models.documents import Document, DocumentMetadata, DocumentStatus
from app.schemas.documents import (
    DocumentMetadataResponse,
    DocumentStatusResponse,
    PresignedUrlResponse,
)
from app.services import storage

router = APIRouter(prefix="/documents", tags=["documents"])


async def _get_doc(db, doc_id: uuid.UUID, tenant_id: uuid.UUID) -> Document:
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.tenant_id == tenant_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc


@router.get("/{doc_id}/status", response_model=DocumentStatusResponse)
async def get_status(doc_id: uuid.UUID, db: DBDep, tenant_id: TenantDep):
    doc = await _get_doc(db, doc_id, tenant_id)
    return DocumentStatusResponse(
        doc_id=doc.id,
        status=doc.status,
        doc_type=doc.doc_type,
        page_count=doc.page_count,
        word_count=doc.word_count,
        error_message=doc.error_message,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


@router.get("/{doc_id}/metadata", response_model=DocumentMetadataResponse)
async def get_metadata(doc_id: uuid.UUID, db: DBDep, tenant_id: TenantDep):
    doc = await _get_doc(db, doc_id, tenant_id)

    if doc.status not in (DocumentStatus.PARSED, DocumentStatus.EMBEDDING, DocumentStatus.READY):
        raise HTTPException(
            status_code=status.HTTP_425_TOO_EARLY,
            detail=f"Document not yet parsed. Current status: {doc.status}",
        )

    result = await db.execute(
        select(DocumentMetadata).where(DocumentMetadata.doc_id == doc_id)
    )
    meta = result.scalar_one_or_none()

    presigned = None
    try:
        presigned = storage.get_presigned_url(doc.file_path)
    except Exception:
        pass

    return DocumentMetadataResponse(
        doc_id=doc.id,
        status=doc.status,
        doc_type=doc.doc_type,
        page_count=doc.page_count,
        word_count=doc.word_count,
        keyword_freq=meta.keyword_freq if meta else None,
        entity_map=meta.entity_map if meta else None,
        page_metadata=meta.page_metadata if meta else None,
        tables=meta.tables if meta else None,
        markdown_output=meta.markdown_output if meta else None,
        structured_json=meta.structured_json if meta else None,
        presigned_url=presigned,
    )


@router.get("/{doc_id}/file", response_model=PresignedUrlResponse)
async def get_file_url(doc_id: uuid.UUID, db: DBDep, tenant_id: TenantDep):
    doc = await _get_doc(db, doc_id, tenant_id)
    try:
        url = storage.get_presigned_url(doc.file_path, expires_in=300)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
    return PresignedUrlResponse(url=url)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(doc_id: uuid.UUID, db: DBDep, tenant_id: TenantDep):
    doc = await _get_doc(db, doc_id, tenant_id)
    try:
        storage.delete_object(doc.file_path)
    except Exception:
        pass
    await db.delete(doc)