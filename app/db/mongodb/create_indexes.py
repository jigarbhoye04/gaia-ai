"""
Database indexes creation logic.
"""

import asyncio

import pymongo

from app.config.loggers import common_logger as logger
from app.db.mongodb.collections import (
    mail_collection,
    projects_collection,
    reminders_collection,
    todos_collection,
    users_collection,
)


async def create_users_indexes():
    """Create indexes for users collection."""
    try:
        await asyncio.gather(
            users_collection.create_index([("email", pymongo.ASCENDING)], unique=True),
        )
        logger.info("Users indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating users indexes: {e}")
        raise


async def create_mail_indexes():
    """Create indexes for mail collection."""
    try:
        await asyncio.gather(
            mail_collection.create_index(
                [("email_id", pymongo.ASCENDING)], unique=True
            ),
        )
        logger.info("Mail indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating mail indexes: {e}")
        raise


async def create_todo_indexes():
    """Create indexes for todos and projects collections."""
    try:
        # Import collections here to avoid circular imports

        await asyncio.gather(
            # Todos collection indexes
            # Compound index for user queries with sorting
            todos_collection.create_index([("user_id", 1), ("created_at", -1)]),
            # Index for project-based queries
            todos_collection.create_index([("user_id", 1), ("project_id", 1)]),
            # Index for due date queries
            todos_collection.create_index([("user_id", 1), ("due_date", 1)]),
            # Index for completion status
            todos_collection.create_index([("user_id", 1), ("completed", 1)]),
            # Index for priority queries
            todos_collection.create_index([("user_id", 1), ("priority", 1)]),
            # Text index for search functionality
            todos_collection.create_index([("title", "text"), ("description", "text")]),
            # Projects collection indexes
            # Index for user queries
            projects_collection.create_index([("user_id", 1), ("created_at", -1)]),
            # Index for default project lookup
            projects_collection.create_index([("user_id", 1), ("is_default", 1)]),
        )
        logger.info("Todo and project indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating todo indexes: {e}")
        raise


async def create_reminder_indexes():
    """Create indexes for the reminders collection."""
    try:
        await asyncio.gather(
            reminders_collection.create_index([("user_id", 1)]),
            reminders_collection.create_index([("status", 1)]),
            reminders_collection.create_index([("scheduled_at", 1)]),
            reminders_collection.create_index([("type", 1)]),
            reminders_collection.create_index([("user_id", 1), ("status", 1)]),
            reminders_collection.create_index([("status", 1), ("scheduled_at", 1)]),
            reminders_collection.create_index([("user_id", 1), ("type", 1)]),
        )
        logger.info("Reminder indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating reminder indexes: {e}")
        raise


async def create_all_indexes():
    """
    Create all necessary indexes for the application.

    Args:
        database: MongoDB database instance
    """
    try:
        await asyncio.gather(
            create_users_indexes(),
            create_mail_indexes(),
            create_todo_indexes(),
            create_reminder_indexes(),
        )
        logger.info("All database indexes created successfully")
    except Exception as e:
        logger.error(f"Error while initializing indexes: {e}")
        raise
