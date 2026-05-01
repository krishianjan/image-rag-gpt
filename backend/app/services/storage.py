import os
import uuid
from pathlib import Path

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.config import settings

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )
    return _client


def build_object_key(tenant_id: uuid.UUID, doc_id: uuid.UUID, filename: str) -> str:
    ext = Path(filename).suffix.lower()
    return f"{tenant_id}/{doc_id}/original{ext}"


def upload_file(local_path: str, object_key: str, content_type: str) -> str:
    _get_client().upload_file(
        local_path,
        settings.R2_BUCKET_NAME,
        object_key,
        ExtraArgs={"ContentType": content_type},
    )
    return object_key


def upload_fileobj(fileobj, object_key: str, content_type: str) -> str:
    _get_client().upload_fileobj(
        fileobj,
        settings.R2_BUCKET_NAME,
        object_key,
        ExtraArgs={"ContentType": content_type},
    )
    return object_key


def download_to_tmp(object_key: str, doc_id: uuid.UUID, suffix: str) -> str:
    os.makedirs(settings.TMP_DIR, exist_ok=True)
    local_path = os.path.join(settings.TMP_DIR, f"{doc_id}{suffix}")
    _get_client().download_file(settings.R2_BUCKET_NAME, object_key, local_path)
    return local_path


def get_presigned_url(object_key: str, expires_in: int = 300) -> str:
    return _get_client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.R2_BUCKET_NAME, "Key": object_key},
        ExpiresIn=expires_in,
    )


def delete_object(object_key: str) -> None:
    try:
        _get_client().delete_object(Bucket=settings.R2_BUCKET_NAME, Key=object_key)
    except ClientError:
        pass