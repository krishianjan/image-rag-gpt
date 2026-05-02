import io
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

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
    """Process document immediately without Celery"""
    from app.database_sync import SyncSessionLocal
    from app.workers.tasks.parse import parse_document_task
    from app.workers.tasks.embed import embed_chunks_task
    from app.workers.tasks.extract import extract_document_task
    
    db = SyncSessionLocal()
    try:
        # Parse
        parse_document_task(doc_id=doc_id, file_path=file_path, tenant_id=tenant_id, mime_type=mime_type)
        
        # Embed
        embed_chunks_task(doc_id=doc_id, tenant_id=tenant_id)
        
        # Extract
        extract_document_task(doc_id=doc_id, tenant_id=tenant_id)
        
        # Update status
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = DocumentStatus.READY
            db.commit()
    except Exception as e:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = DocumentStatus.FAILED
            doc.error_message = str(e)
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
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}",
        )

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
        id=doc_id,
        tenant_id=tenant_id,
        schema_id=schema_id,
        original_filename=file.filename or "upload",
        file_path=object_key,
        file_size=file_size,
        mime_type=file.content_type,
        status=DocumentStatus.PROCESSING,
        callback_url=callback_url,
    )
    db.add(doc)
    await db.commit()

    # Process in background thread
    import threading
    thread = threading.Thread(
        target=process_document_sync,
        args=(str(doc_id), object_key, str(tenant_id), file.content_type)
    )
    thread.start()

    return UploadResponse(
        doc_id=doc_id,
        job_id=str(doc_id),
        status=DocumentStatus.PROCESSING,
        filename=file.filename or "upload",
    )
