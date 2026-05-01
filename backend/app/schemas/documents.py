import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.documents import DocumentStatus, DocumentType


class TenantCreate(BaseModel):
    name: str


class TenantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tenant_id: uuid.UUID


class UploadResponse(BaseModel):
    doc_id: uuid.UUID
    job_id: str
    status: DocumentStatus
    filename: str


class DocumentStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    doc_id: uuid.UUID
    status: DocumentStatus
    doc_type: DocumentType
    page_count: int | None
    word_count: int | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class BoundingBox(BaseModel):
    x0: float
    y0: float
    x1: float
    y1: float


class TextElement(BaseModel):
    text: str
    type: str
    bboxes: list[dict[str, Any]]


class DocumentMetadataResponse(BaseModel):
    doc_id: uuid.UUID
    status: DocumentStatus
    doc_type: DocumentType
    page_count: int | None
    word_count: int | None
    keyword_freq: dict[str, int] | None
    entity_map: dict[str, list[str]] | None
    page_metadata: list[dict[str, Any]] | None
    tables: list[dict[str, Any]] | None
    markdown_output: str | None
    structured_json: dict[str, Any] | None
    presigned_url: str | None


class PresignedUrlResponse(BaseModel):
    url: str
    expires_in: int = 300


class ExtractionSchemaCreate(BaseModel):
    name: str
    schema_def: dict[str, Any]


class ExtractionSchemaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    schema_def: dict[str, Any]
    created_at: datetime