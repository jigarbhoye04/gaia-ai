from celery import Celery
import os

from app.config.settings import settings

broker_url = os.getenv("CELERY_BROKER_URL", "amqp://guest:guest@localhost:5672//")
result_backend = os.getenv("CELERY_RESULT_BACKEND", "rpc://")

celery = Celery(
    "gaia",
    broker=broker_url,
    backend=result_backend,
    include=["app.tasks.mail_tasks"],
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    worker_concurrency=4 if settings.ENV == "production" else 1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    broker_connection_retry_on_startup=True,
    # task_time_limit=30 * 60,  # 30 minutes
)

if __name__ == "__main__":
    celery.start()
