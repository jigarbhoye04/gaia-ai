"""
ARQ worker for processing reminder tasks.
"""

import asyncio
from datetime import datetime, timedelta

from arq import cron
from arq.connections import RedisSettings

from app.config.loggers import arq_worker_logger as logger
from app.config.settings import settings
from app.db.mongodb.collections import reminders_collection
from app.services.reminder_service import process_reminder_task


async def startup(ctx: dict):
    """ARQ worker startup function."""
    logger.info("ARQ worker starting up...")

    # Initialize any resources needed by worker
    # For example, database connections, external service clients, etc.
    ctx["startup_time"] = asyncio.get_event_loop().time()
    logger.info("ARQ worker startup complete")


async def shutdown(ctx: dict):
    """ARQ worker shutdown function."""
    logger.info("ARQ worker shutting down...")

    # Clean up any resources
    startup_time = ctx.get("startup_time", 0)
    runtime = asyncio.get_event_loop().time() - startup_time
    logger.info(f"ARQ worker ran for {runtime:.2f} seconds")


async def process_reminder(ctx: dict, reminder_id: str) -> str:
    """
    Process a reminder task.

    Args:
        ctx: ARQ context
        reminder_id: ID of the reminder to process

    Returns:
        Processing result message
    """
    logger.info(f"Processing reminder task: {reminder_id}")

    try:
        # Process the reminder
        await process_reminder_task(reminder_id)

        result = f"Successfully processed reminder {reminder_id}"
        logger.info(result)
        return result

    except Exception as e:
        error_msg = f"Failed to process reminder {reminder_id}: {str(e)}"
        logger.error(error_msg)
        raise


async def process_batch_reminders(ctx: dict, reminder_ids: list[str]) -> str:
    """
    Process multiple reminder tasks in batch.

    Args:
        ctx: ARQ context
        reminder_ids: List of reminder IDs to process

    Returns:
        Processing result message
    """
    logger.info(f"Processing batch of {len(reminder_ids)} reminders")

    results = []
    errors = []

    for reminder_id in reminder_ids:
        try:
            result = await process_reminder(ctx, reminder_id)
            results.append(result)
        except Exception as e:
            error = f"Failed to process reminder {reminder_id}: {str(e)}"
            errors.append(error)
            logger.error(error)

    summary = f"Processed {len(results)} reminders successfully, {len(errors)} failed"
    logger.info(summary)

    if errors:
        logger.error(f"Batch processing errors: {errors}")

    return summary


async def cleanup_expired_reminders(ctx: dict) -> str:
    """
    Cleanup expired or completed reminders (scheduled task).

    Args:
        ctx: ARQ context

    Returns:
        Cleanup result message
    """
    logger.info("Running cleanup of expired reminders")

    try:
        # Remove completed reminders older than 30 days
        cutoff_date = datetime.utcnow() - timedelta(days=30)

        result = await reminders_collection.delete_many(
            {
                "status": {"$in": ["completed", "cancelled"]},
                "updated_at": {"$lt": cutoff_date},
            }
        )

        message = f"Cleaned up {result.deleted_count} expired reminders"
        logger.info(message)
        return message

    except Exception as e:
        error_msg = f"Failed to cleanup expired reminders: {str(e)}"
        logger.error(error_msg)
        raise


workerSettings = {
    "redis_settings": RedisSettings.from_dsn(settings.REDIS_URL),
    # Task functions
    "functions": [
        process_reminder,
        process_batch_reminders,
        cleanup_expired_reminders,
    ],
    # Scheduled tasks (cron jobs)
    "cron_jobs": [
        # Cleanup expired reminders daily at 2 AM
        cron(cleanup_expired_reminders, hour=2, minute=0),
    ],
    # Worker configuration
    "on_startup": startup,
    "on_shutdown": shutdown,
    # Performance settings
    "max_jobs": 10,
    "job_timeout": 300,  # 5 minutes
    "keep_result": 3600,  # Keep results for 1 hour
    # Logging
    "log_results": True,
    # Health check settings
    "health_check_interval": 30,
    "health_check_key": "arq:health",
}


async def run_worker():
    """Run the ARQ worker."""
    from arq import run_worker as arq_run_worker

    logger.info("Starting ARQ worker...")
    arq_run_worker(settings_cls=workerSettings)


def main():
    """Main entry point for running the worker."""

    # Run the worker
    asyncio.run(run_worker())
