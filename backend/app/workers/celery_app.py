from celery import Celery
import os

from app.config import settings

# Use RabbitMQ if available, otherwise fall back to Redis
BROKER_URL = os.getenv("CELERY_BROKER_URL", settings.REDIS_URL)
RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", settings.REDIS_URL)

celery_app = Celery(
    "documind",
    broker=BROKER_URL,
    backend=RESULT_BACKEND,
    include=["app.workers.tasks.parse", "app.workers.tasks.embed", "app.workers.tasks.extract"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.workers.tasks.parse.parse_document_task": {"queue": "fast_queue"},
        "app.workers.tasks.embed.embed_chunks_task": {"queue": "fast_queue"},
        "app.workers.tasks.extract.extract_document_task": {"queue": "fast_queue"},
    },
    task_default_queue="fast_queue",
    result_expires=86400,
)
