import os

from celery import Celery
from celery.signals import worker_init, worker_ready

from app.config.loggers import celery_logger as logger
from app.config.settings import settings
from app.services.text_service import get_zero_shot_classifier

broker_url = os.getenv("CELERY_BROKER_URL", "amqp://guest:guest@localhost:5672//")
result_backend = os.getenv("CELERY_RESULT_BACKEND", "rpc://")


# if settings.ENV == "production":
#     broker_url = os.getenv("CELERY_BROKER_URL", "amqp://guest:guest@localhost:5672//")
#     result_backend = os.getenv("CELERY_RESULT_BACKEND", "rpc://")
# else:
#     broker_url = "memory://"
#     result_backend = "cache+memory://"


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
    worker_prefetch_multiplier=1,
    task_time_limit=10 * 60,
    task_soft_time_limit=8 * 60,
    worker_max_tasks_per_child=100,
    task_default_rate_limit="30/m",
)


@worker_init.connect
def startup_message(sender, **kwargs):
    logger.info("-------  Celery Worker is initializing...  -------")
    logger.info("Initializing zero-shot classification model...")
    get_zero_shot_classifier()
    logger.info("Model initialization completed.")


@worker_ready.connect
def ready_message(sender, **kwargs):
    logger.info("-------  Celery Worker is ready & waiting for tasks!  -------")


if __name__ == "__main__":
    celery.start()
