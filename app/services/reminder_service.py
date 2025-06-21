"""
Reminder scheduler for managing reminder tasks.
"""

from datetime import datetime, timezone
from typing import List, Optional

from arq import create_pool
from arq.connections import RedisSettings
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config.loggers import general_logger as logger
from app.config.settings import settings
from app.db.mongodb.collections import reminders_collection
from app.models.reminder_models import (
    CreateReminderRequest,
    ReminderModel,
    ReminderStatus,
)
from app.utils.cron_utils import get_next_run_time


class ReminderScheduler:
    """
    Manages reminder scheduling and execution.
    """

    def __init__(self, redis_settings: Optional[RedisSettings] = None):
        """
        Initialize the reminder scheduler.

        Args:
            redis_settings: Redis connection settings for ARQ
        """
        self.redis_settings = redis_settings or RedisSettings.from_dsn(
            settings.REDIS_URL
        )
        self.db: Optional[AsyncIOMotorDatabase] = None
        self.arq_pool = None

    async def initialize(self):
        """Initialize database connection and ARQ pool."""
        self.arq_pool = await create_pool(self.redis_settings)
        logger.info("ReminderScheduler initialized")

    async def close(self):
        """Close connections."""
        if self.arq_pool:
            await self.arq_pool.close()

        logger.info("ReminderScheduler closed")

    async def create_reminder(
        self, reminder_data: CreateReminderRequest, user_id: str
    ) -> str:
        """
        Create a new reminder and schedule it.

        Args:
            reminder_data: Reminder data dictionary

        Returns:
            Created reminder ID
        """
        # Set scheduled_at if not provided
        if not reminder_data.scheduled_at:
            repeat = reminder_data.repeat
            if repeat:
                reminder_data.scheduled_at = get_next_run_time(
                    cron_expr=repeat, base_time=reminder_data.base_time
                )
            else:
                raise ValueError(
                    "scheduled_at must be provided or repeat must be specified"
                )

        reminder = ReminderModel(**reminder_data.model_dump(), user_id=user_id)

        # Insert into MongoDB
        result = await reminders_collection.insert_one(
            document=self._serialize_reminder(reminder)
        )
        reminder_id = str(result.inserted_id)

        # Schedule the task in ARQ
        await self._enqueue_reminder(reminder_id, reminder.scheduled_at)

        logger.info(
            f"Created and scheduled reminder {reminder_id} for {reminder.scheduled_at}"
        )
        return reminder_id

    async def update_reminder(
        self, reminder_id: str, update_data: dict, user_id: str
    ) -> bool:
        """
        Update an existing reminder.

        Args:
            reminder_id: Reminder ID to update
            update_data: Fields to update

        Returns:
            True if updated successfully
        """
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.now(timezone.utc)

        filters: dict = {"_id": ObjectId(reminder_id)}
        if user_id:
            filters["user_id"] = user_id

        result = await reminders_collection.update_one(filters, {"$set": update_data})

        if result.modified_count > 0:
            logger.info(f"Updated reminder {reminder_id}")

            # If scheduled_at was updated, reschedule the task
            if "scheduled_at" in update_data and "status" in update_data:
                if update_data["status"] == ReminderStatus.SCHEDULED:
                    await self._enqueue_reminder(
                        reminder_id, update_data["scheduled_at"]
                    )

            return True

        return False

    async def cancel_reminder(self, reminder_id: str, user_id: str) -> bool:
        """
        Cancel a reminder.

        Args:
            reminder_id: Reminder ID to cancel

        Returns:
            True if cancelled successfully
        """
        filters: dict = {"_id": ObjectId(reminder_id)}
        if user_id:
            filters["user_id"] = user_id

        result = await reminders_collection.update_one(
            filters,
            {
                "$set": {
                    "status": ReminderStatus.CANCELLED,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        if result.modified_count > 0:
            logger.info(f"Cancelled reminder {reminder_id}")
            return True

        return False

    async def get_reminder(
        self, reminder_id: str, user_id: Optional[str] = None
    ) -> Optional[ReminderModel]:
        """
        Get a reminder by ID.

        Args:
            reminder_id: Reminder ID

        Returns:
            Reminder model or None if not found
        """
        filters: dict = {"_id": ObjectId(reminder_id)}
        if user_id:
            filters["user_id"] = user_id

        doc = await reminders_collection.find_one(filters)
        if doc:
            doc["_id"] = str(doc["_id"])  # Convert ObjectId to string
            return ReminderModel(**doc)
        return None

    async def list_user_reminders(
        self,
        user_id: str,
        status: Optional[ReminderStatus] = None,
        limit: int = 100,
        skip: int = 0,
    ) -> List[ReminderModel]:
        """
        List reminders for a user.

        Args:
            user_id: User ID
            status: Filter by status (optional)
            limit: Maximum number of results
            skip: Number of results to skip

        Returns:
            List of reminder models
        """
        query = {"user_id": user_id}
        if status:
            query["status"] = status

        cursor = reminders_collection.find(query).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)

        results = []

        # Convert ObjectId to string and create ReminderModel instances
        for doc in docs:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            results.append(ReminderModel(**doc))

        return results

    async def scan_and_schedule_pending_reminders(self):
        """
        Scan MongoDB for scheduled reminders and enqueue them in ARQ.
        Called during server startup.
        """
        now = datetime.now(timezone.utc)

        # Find all scheduled reminders that should run in the future
        cursor = reminders_collection.find(
            {"status": ReminderStatus.SCHEDULED, "scheduled_at": {"$gte": now}}
        )

        scheduled_count = 0
        async for doc in cursor:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            reminder = ReminderModel(**doc)
            await self._enqueue_reminder(str(reminder.id), reminder.scheduled_at)
            scheduled_count += 1

        logger.info(f"Scheduled {scheduled_count} pending reminders")

    async def process_reminder_task(self, reminder_id: str):
        """
        Process a reminder task (called by ARQ worker).

        Args:
            reminder_id: Reminder ID to process
        """
        # Get the reminder from database
        reminder = await self.get_reminder(reminder_id)
        if not reminder:
            logger.error(f"Reminder {reminder_id} not found")
            return

        if reminder.status != ReminderStatus.SCHEDULED:
            logger.warning(
                f"Reminder {reminder_id} is not scheduled (status: {reminder.status})"
            )
            return

        logger.info(f"Processing reminder {reminder_id} of type {reminder.agent}")

        try:
            # Execute the reminder task based on type
            await self._execute_reminder_task(reminder)

            # Increment occurrence count
            occurrence_count = reminder.occurrence_count + 1

            # Check if this is a recurring reminder
            if reminder.repeat:
                # Calculate next run time
                next_run = get_next_run_time(reminder.repeat, reminder.scheduled_at)

                # Check if we should continue scheduling
                should_continue = True

                # Check max occurrences
                if (
                    reminder.max_occurrences
                    and occurrence_count >= reminder.max_occurrences
                ):
                    should_continue = False
                    logger.info(
                        f"Reminder {reminder_id} reached max occurrences ({reminder.max_occurrences})"
                    )

                # Check stop_after date
                if reminder.stop_after and next_run >= reminder.stop_after:
                    should_continue = False
                    logger.info(
                        f"Reminder {reminder_id} reached stop_after date ({reminder.stop_after})"
                    )

                if should_continue:
                    # Update and reschedule
                    await self.update_reminder(
                        reminder_id,
                        {
                            "scheduled_at": next_run,
                            "occurrence_count": occurrence_count,
                            "status": ReminderStatus.SCHEDULED,
                        },
                        reminder.user_id,
                    )
                    await self._enqueue_reminder(reminder_id, next_run)
                    logger.info(
                        f"Rescheduled recurring reminder {reminder_id} for {next_run}"
                    )
                else:
                    # Mark as completed
                    await self.update_reminder(
                        reminder_id,
                        {
                            "occurrence_count": occurrence_count,
                            "status": ReminderStatus.COMPLETED,
                        },
                        reminder.user_id,
                    )
                    logger.info(f"Completed recurring reminder {reminder_id}")
            else:
                # One-time reminder - mark as completed
                await self.update_reminder(
                    reminder_id,
                    {
                        "occurrence_count": occurrence_count,
                        "status": ReminderStatus.COMPLETED,
                    },
                    reminder.user_id,
                )
                logger.info(f"Completed one-time reminder {reminder_id}")

        except Exception as e:
            logger.error(f"Failed to process reminder {reminder_id}: {str(e)}")
            # Optionally update status to indicate failure
            await self.update_reminder(
                reminder_id,
                {
                    "status": ReminderStatus.CANCELLED,  # or create a FAILED status
                    "updated_at": datetime.now(timezone.utc),
                },
                reminder.user_id,
            )

    async def _enqueue_reminder(self, reminder_id: str, scheduled_at: datetime):
        """
        Enqueue a reminder task in ARQ.

        Args:
            reminder_id: Reminder ID
            scheduled_at: When to execute the task
        """
        if not self.arq_pool:
            logger.error("ARQ pool not initialized")
            return

        # Schedule the task
        job = await self.arq_pool.enqueue_job(
            "process_reminder", reminder_id, _defer_until=scheduled_at
        )

        if not job:
            logger.error(f"Failed to enqueue reminder {reminder_id}")
            return

        logger.debug(f"Enqueued reminder {reminder_id} with job ID {job.job_id}")

    async def _execute_reminder_task(self, reminder: ReminderModel):
        """
        Execute the actual reminder task based on its type.

        Args:
            reminder: Reminder to execute
        """
        # Import here to avoid circular imports
        from app.tasks.reminder_tasks import execute_reminder_by_agent

        await execute_reminder_by_agent(reminder)

    def _serialize_reminder(self, reminder: ReminderModel) -> dict:
        """
        Serialize a ReminderModel to a dictionary for MongoDB storage.

        Args:
            reminder: ReminderModel instance

        Returns:
            Dictionary representation of the reminder
        """
        reminder_dict = reminder.model_dump(by_alias=True)
        if reminder_dict.get("_id") is None:
            # Ensure to remove _id if it was not set
            reminder_dict.pop("_id", None)

        print(reminder_dict)
        return reminder_dict


# Global scheduler instance
_scheduler: Optional[ReminderScheduler] = None


async def initialize_scheduler() -> ReminderScheduler:
    """Initialize the global scheduler instance."""
    global _scheduler
    if _scheduler is None:
        _scheduler = ReminderScheduler()
        await _scheduler.initialize()
        logger.info("Global scheduler initialized")
    return _scheduler


async def get_scheduler() -> ReminderScheduler:
    """Get the global scheduler instance, initializing if needed."""
    global _scheduler
    if _scheduler is None:
        await initialize_scheduler()
    return _scheduler  # type: ignore  # We know it's not None after initialize_scheduler


async def close_scheduler():
    """Close the global scheduler instance."""
    global _scheduler
    if _scheduler:
        await _scheduler.close()
        _scheduler = None
        logger.info("Global scheduler closed")


# Convenience functions that use the global scheduler
async def create_reminder(reminder_data: CreateReminderRequest, user_id: str) -> str:
    """Create a reminder using the global scheduler."""
    scheduler = await get_scheduler()
    return await scheduler.create_reminder(reminder_data, user_id=user_id)


async def get_reminder(
    reminder_id: str, user_id: Optional[str]
) -> Optional[ReminderModel]:
    """Get a reminder using the global scheduler."""
    scheduler = await get_scheduler()
    return await scheduler.get_reminder(reminder_id, user_id)


async def update_reminder(reminder_id: str, update_data: dict, user_id: str) -> bool:
    """Update a reminder using the global scheduler."""
    scheduler = await get_scheduler()
    return await scheduler.update_reminder(reminder_id, update_data, user_id)


async def cancel_reminder(reminder_id: str, user_id: str) -> bool:
    """Cancel a reminder using the global scheduler."""
    scheduler = await get_scheduler()
    return await scheduler.cancel_reminder(reminder_id, user_id)


async def list_user_reminders(
    user_id: str,
    status: Optional[ReminderStatus] = None,
    limit: int = 100,
    skip: int = 0,
) -> List[ReminderModel]:
    """List user reminders using the global scheduler."""
    scheduler = await get_scheduler()
    return await scheduler.list_user_reminders(user_id, status, limit, skip)


async def process_reminder_task(reminder_id: str):
    """Process a reminder task using the global scheduler."""
    scheduler = await get_scheduler()
    return await scheduler.process_reminder_task(reminder_id)
