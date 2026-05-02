import io
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, status

from app.api.deps import DBDep, TenantDep
from app.models.documents import Document, DocumentStatus
from app.schemas.documents import UploadResponse
from app.services import storage
from app.workers.tasks.parse import parse_document_task

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
            detail=f"Unsupported file type: {file.content_type}. Allowed: {sorted(ALLOWED_MIME)}",
        )

    contents = await file.read()
    file_size = len(contents)

    if file_size == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {MAX_FILE_SIZE // 1024 // 1024}MB limit",
        )

    doc_id = uuid.uuid4()
    object_key = storage.build_object_key(tenant_id, doc_id, file.filename or "upload.pdf")

    try:
        storage.upload_fileobj(
            io.BytesIO(contents),
            object_key,
            file.content_type,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Storage upload failed: {exc}",
        )

    doc = Document(
        id=doc_id,
        tenant_id=tenant_id,
        schema_id=schema_id,
        original_filename=file.filename or "upload",
        file_path=object_key,
        file_size=file_size,
        mime_type=file.content_type,
        status=DocumentStatus.PENDING,
        callback_url=callback_url,
    )
    db.add(doc)
    await db.flush()

    # Process synchronously (no Redis/Celery needed)
    try:
        from app.workers.tasks.parse import parse_document_task
        parse_document_task(
            doc_id=str(doc_id),
            file_path=object_key,
            tenant_id=str(tenant_id),
            mime_type=file.content_type,
        )
        doc.status = DocumentStatus.PROCESSING
    except Exception:
        doc.status = DocumentStatus.PENDING

    return UploadResponse(
        doc_id=doc_id,
        job_id=task.id,
        status=DocumentStatus.PENDING,
        filename=file.filename or "upload",
    )
