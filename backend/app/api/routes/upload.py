import io
import uuid
import threading

from fastapi import APIRouter, HTTPException, UploadFile, status

from app.api.deps import DBDep, TenantDep
from app.models.documents import Document, DocumentStatus
from app.schemas.documents import UploadResponse
from app.services import storage

router = APIRouter(tags=["upload"])

ALLOWED_MIME = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/tiff",
    "image/webp",
}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


def process_document_sync(doc_id, file_path, tenant_id, mime_type):
    """Process document in background thread - no Celery/Redis needed"""
    from app.database_sync import SyncSessionLocal
    db = SyncSessionLocal()
    try:
        from app.workers.tasks.parse import _parse_document_with_docling, _parse_image
        from app.services import storage as storage_service
        
        # Download file from R2
        local_path = storage_service.download_to_tmp(file_path, doc_id, suffix=".pdf")
        
        # Parse based on file type
        if mime_type.startswith("image/"):
            result = _parse_image(local_path, mime_type)
        else:
            result = _parse_document_with_docling(local_path)
        
        # Save metadata
        from app.models.documents import DocumentMetadata
        metadata = DocumentMetadata(
            doc_id=doc_id,
            tenant_id=tenant_id,
            raw_text=result.get("markdown", ""),
            page_metadata=result.get("pages", []),
            tables=result.get("tables", []),
        )
        db.add(metadata)
        
        # Update document
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.page_count = len(result.get("pages", []))
            doc.word_count = len(result.get("markdown", "").split())
            doc.status = DocumentStatus.READY
        db.commit()
            
    except Exception as e:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = DocumentStatus.FAILED
            doc.error_message = str(e)[:500]
            db.commit()
    finally:
        db.close()


@router.post("/", response_model=UploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    file: UploadFile,
    db: DBDep,
    tenant_id: TenantDep,
    schema_id: uuid.UUID | None = None,
    callback_url: str | None = None,
):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=f"Unsupported file type: {file.content_type}")

    contents = await file.read()
    file_size = len(contents)
    if file_size == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

    doc_id = uuid.uuid4()
    object_key = storage.build_object_key(tenant_id, doc_id, file.filename or "upload.pdf")

    try:
        storage.upload_fileobj(io.BytesIO(contents), object_key, file.content_type)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Storage failed: {exc}")

    doc = Document(
        id=doc_id, tenant_id=tenant_id, schema_id=schema_id,
        original_filename=file.filename or "upload", file_path=object_key,
        file_size=file_size, mime_type=file.content_type,
        status=DocumentStatus.PROCESSING, callback_url=callback_url,
    )
    db.add(doc)
    await db.commit()

    threading.Thread(target=process_document_sync, args=(str(doc_id), object_key, str(tenant_id), file.content_type), daemon=True).start()

    return UploadResponse(doc_id=doc_id, job_id=str(doc_id), status=DocumentStatus.PROCESSING, filename=file.filename or "upload")
