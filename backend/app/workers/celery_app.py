from celery import Celery

from app.config import settings

celery_app = Celery(
    "documind",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
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
        "app.workers.tasks.parse.parse_document_task": {"queue": "slow_queue"},
        "app.workers.tasks.parse.classify_document_task": {"queue": "fast_queue"},
        "app.workers.tasks.embed.embed_chunks_task": {"queue": "slow_queue"},
        "app.workers.tasks.extract.extract_document_task": {"queue": "slow_queue"},
    },
    task_default_queue="fast_queue",
    task_queues={
        "fast_queue": {"exchange": "fast_queue", "routing_key": "fast"},
        "slow_queue": {"exchange": "slow_queue", "routing_key": "slow"},
    },
    result_expires=86400,
)