"""
Comprehensive database indexes for all MongoDB collections.
Follows MongoDB indexing best practices for optimal query performance.

Index Strategy:
- User-centric compound indexes for multi-tenant queries
- Sparse indexes for optional fields to reduce storage
- Text search indexes for content discovery
- Unique constraints for data integrity
- ESR (Equality, Sort, Range) ordering for compound indexes
"""

from typing import Dict, List
from app.config.loggers import app_logger as logger
from app.db.collections import (
    users_collection,
    conversations_collection,
    goals_collection,
    notes_collection,
    calendars_collection,
    mail_collection,
    blog_collection,
    files_collection,
    notifications_collection,
    todos_collection,
    projects_collection,
)


async def create_all_indexes():
    """
    Create all database indexes for optimal performance.
    This is the main function called during application startup.

    Indexes are created with best practices:
    - User-specific compound indexes for multi-tenant queries
    - Date-based sorting indexes for pagination
    - Text search indexes for full-text search
    - Unique indexes for data integrity
    - Compound indexes ordered by: equality → range → sort
    """
    try:
        logger.info("Starting comprehensive database index creation...")

        # Track index creation success/failure
        index_results = {}

        # Create indexes for each collection with error isolation
        collections = [
            ("users", create_user_indexes),
            ("conversations", create_conversation_indexes),
            ("todos", create_todo_indexes),
            ("projects", create_project_indexes),
            ("goals", create_goal_indexes),
            ("notes", create_note_indexes),
            ("files", create_file_indexes),
            ("mail", create_mail_indexes),
            ("calendar", create_calendar_indexes),
            ("blog", create_blog_indexes),
            ("notifications", create_notification_indexes),
        ]

        for collection_name, create_func in collections:
            try:
                await create_func()
                index_results[collection_name] = "SUCCESS"
            except Exception as e:
                logger.error(
                    f"Failed to create indexes for {collection_name}: {str(e)}"
                )
                index_results[collection_name] = f"FAILED: {str(e)}"
                # Continue with other collections instead of failing completely
                continue

        # Log summary
        successful = sum(1 for result in index_results.values() if result == "SUCCESS")
        total = len(index_results)

        logger.info(
            f"Database index creation completed: {successful}/{total} collections successful"
        )

        # Log any failures
        failed_collections = [
            name for name, result in index_results.items() if result != "SUCCESS"
        ]
        if failed_collections:
            logger.warning(
                f"Failed to create indexes for collections: {failed_collections}"
            )

    except Exception as e:
        logger.error(f"Critical error during database index creation: {str(e)}")
        raise


async def create_user_indexes():
    """Create indexes for users collection."""
    try:
        # Email unique index (primary lookup method)
        await users_collection.create_index("email", unique=True)

        # Onboarding status with creation date
        await users_collection.create_index(
            [("onboarding.completed", 1), ("created_at", -1)]
        )

        # Cache cleanup index (sparse since not all users have cached_at)
        await users_collection.create_index("cached_at", sparse=True)

        logger.info("Created user indexes")

    except Exception as e:
        logger.error(f"Error creating user indexes: {str(e)}")
        raise


async def create_conversation_indexes():
    """Create indexes for conversations collection."""
    try:
        # Primary compound index for user conversations with sorting (most critical)
        await conversations_collection.create_index([("user_id", 1), ("createdAt", -1)])

        # For specific conversation lookups (extremely critical for performance)
        await conversations_collection.create_index(
            [("user_id", 1), ("conversation_id", 1)]
        )

        # For starred conversations queries
        await conversations_collection.create_index(
            [("user_id", 1), ("starred", 1), ("createdAt", -1)]
        )

        # For message pinning operations (nested array queries)
        await conversations_collection.create_index(
            [("user_id", 1), ("messages.message_id", 1)]
        )

        # For message pinning aggregations
        await conversations_collection.create_index(
            [("user_id", 1), ("messages.pinned", 1)]
        )

        logger.info("Created conversation indexes")

    except Exception as e:
        logger.error(f"Error creating conversation indexes: {str(e)}")
        raise


async def create_todo_indexes():
    """Create indexes for todos collection."""
    try:
        # Primary compound index for user todos with sorting
        await todos_collection.create_index([("user_id", 1), ("created_at", -1)])

        # Project-based queries
        await todos_collection.create_index([("user_id", 1), ("project_id", 1)])

        # Enhanced compound indexes for complex filtering
        await todos_collection.create_index(
            [("user_id", 1), ("completed", 1), ("created_at", -1)]
        )
        await todos_collection.create_index(
            [("user_id", 1), ("priority", 1), ("created_at", -1)]
        )
        await todos_collection.create_index([("user_id", 1), ("due_date", 1)])

        # For overdue queries (critical for performance) - sparse for due_date
        await todos_collection.create_index(
            [("user_id", 1), ("due_date", 1), ("completed", 1)], sparse=True
        )

        # For project + completion status queries
        await todos_collection.create_index(
            [("user_id", 1), ("project_id", 1), ("completed", 1)]
        )

        # For label-based filtering (sparse since not all todos have labels)
        await todos_collection.create_index(
            [("user_id", 1), ("labels", 1)], sparse=True
        )

        # Text search index for title and description
        await todos_collection.create_index(
            [("title", "text"), ("description", "text")]
        )

        # For subtask operations (sparse since not all todos have subtasks)
        await todos_collection.create_index(
            [("user_id", 1), ("subtasks.id", 1)], sparse=True
        )

        logger.info("Created todo indexes")

    except Exception as e:
        logger.error(f"Error creating todo indexes: {str(e)}")
        raise


async def create_project_indexes():
    """Create indexes for projects collection."""
    try:
        # Primary compound index for user projects
        await projects_collection.create_index([("user_id", 1), ("created_at", -1)])

        # For default project lookup
        await projects_collection.create_index([("user_id", 1), ("is_default", 1)])

        # For project name searches
        await projects_collection.create_index([("user_id", 1), ("name", 1)])

        logger.info("Created project indexes")

    except Exception as e:
        logger.error(f"Error creating project indexes: {str(e)}")
        raise


async def create_goal_indexes():
    """Create indexes for goals collection."""
    try:
        # Primary index for user goals
        await goals_collection.create_index([("user_id", 1), ("created_at", -1)])

        # For progress tracking
        await goals_collection.create_index([("user_id", 1), ("progress", 1)])

        # For todo integration queries
        await goals_collection.create_index([("user_id", 1), ("todo_project_id", 1)])
        await goals_collection.create_index([("user_id", 1), ("todo_id", 1)])

        logger.info("Created goal indexes")

    except Exception as e:
        logger.error(f"Error creating goal indexes: {str(e)}")
        raise


async def create_note_indexes():
    """Create indexes for notes collection."""
    try:
        # For user-specific note queries
        await notes_collection.create_index([("user_id", 1), ("created_at", -1)])

        # For individual note lookups
        await notes_collection.create_index([("user_id", 1), ("_id", 1)])

        # For auto-created notes filtering (sparse since not all notes have this field)
        await notes_collection.create_index(
            [("user_id", 1), ("auto_created", 1)], sparse=True
        )

        # Text search index for content search
        await notes_collection.create_index([("plaintext", "text"), ("title", "text")])

        logger.info("Created note indexes")

    except Exception as e:
        logger.error(f"Error creating note indexes: {str(e)}")
        raise


async def create_file_indexes():
    """Create indexes for files collection."""
    try:
        # For user file queries
        await files_collection.create_index([("user_id", 1), ("uploaded_at", -1)])

        # For specific file lookups (critical)
        await files_collection.create_index([("user_id", 1), ("file_id", 1)])

        # For conversation-based file queries
        await files_collection.create_index([("user_id", 1), ("conversation_id", 1)])

        # For file type filtering
        await files_collection.create_index([("user_id", 1), ("content_type", 1)])

        logger.info("Created file indexes")

    except Exception as e:
        logger.error(f"Error creating file indexes: {str(e)}")
        raise


async def create_mail_indexes():
    """Create indexes for mail collection."""
    try:
        # Unique index for email IDs
        await mail_collection.create_index("email_id", unique=True)

        # For user-specific mail queries
        await mail_collection.create_index([("user_id", 1), ("date", -1)])

        # For thread-based queries
        await mail_collection.create_index([("user_id", 1), ("thread_id", 1)])

        # For label-based filtering
        await mail_collection.create_index([("user_id", 1), ("labels", 1)])

        # For read/unread status
        await mail_collection.create_index([("user_id", 1), ("is_read", 1)])

        logger.info("Created mail indexes")

    except Exception as e:
        logger.error(f"Error creating mail indexes: {str(e)}")
        raise


async def create_calendar_indexes():
    """Create indexes for calendar collection."""
    try:
        # For user calendar preferences
        await calendars_collection.create_index("user_id")

        # For event queries
        await calendars_collection.create_index([("user_id", 1), ("event_date", 1)])

        # For calendar selection queries
        await calendars_collection.create_index(
            [("user_id", 1), ("selected_calendars", 1)]
        )

        logger.info("Created calendar indexes")

    except Exception as e:
        logger.error(f"Error creating calendar indexes: {str(e)}")
        raise


async def create_blog_indexes():
    """Create indexes for blog collection."""
    try:
        # Unique slug index
        await blog_collection.create_index("slug", unique=True)

        # Date-based sorting
        await blog_collection.create_index([("date", -1)])

        # Category filtering
        await blog_collection.create_index("category")

        # Author queries
        await blog_collection.create_index("authors")

        # Compound index for published blogs
        await blog_collection.create_index([("date", -1), ("category", 1)])

        # Text search index
        await blog_collection.create_index(
            [
                ("title", "text"),
                ("content", "text"),
                ("description", "text"),
                ("tags", "text"),
            ]
        )

        logger.info("Created blog indexes")

    except Exception as e:
        logger.error(f"Error creating blog indexes: {str(e)}")
        raise


async def create_notification_indexes():
    """Create indexes for notifications collection."""
    try:
        # For user-specific notifications
        await notifications_collection.create_index(
            [("user_id", 1), ("created_at", -1)]
        )

        # For unread notifications
        await notifications_collection.create_index(
            [("user_id", 1), ("read", 1), ("created_at", -1)]
        )

        # For notification type filtering
        await notifications_collection.create_index([("user_id", 1), ("type", 1)])

        logger.info("Created notification indexes")

    except Exception as e:
        logger.error(f"Error creating notification indexes: {str(e)}")
        raise


async def get_index_status() -> Dict[str, List[str]]:
    """
    Get the current index status for all collections.
    Useful for monitoring and debugging index usage.

    Returns:
        Dict mapping collection names to lists of index names
    """
    try:
        collections = {
            "users": users_collection,
            "conversations": conversations_collection,
            "todos": todos_collection,
            "projects": projects_collection,
            "goals": goals_collection,
            "notes": notes_collection,
            "files": files_collection,
            "mail": mail_collection,
            "calendar": calendars_collection,
            "blog": blog_collection,
            "notifications": notifications_collection,
        }

        index_status = {}

        for name, collection in collections.items():
            try:
                indexes = await collection.list_indexes().to_list(length=None)
                index_names = [idx.get("name", "unnamed") for idx in indexes]
                index_status[name] = index_names
            except Exception as e:
                logger.error(f"Failed to get indexes for {name}: {str(e)}")
                index_status[name] = [f"ERROR: {str(e)}"]

        return index_status

    except Exception as e:
        logger.error(f"Error getting index status: {str(e)}")
        return {"error": [str(e)]}


async def log_index_summary():
    """Log a summary of all collection indexes for monitoring purposes."""
    try:
        index_status = await get_index_status()

        logger.info("=== DATABASE INDEX SUMMARY ===")

        total_indexes = 0
        for collection_name, indexes in index_status.items():
            if not indexes or (len(indexes) == 1 and indexes[0].startswith("ERROR")):
                logger.warning(f"{collection_name}: No indexes or error")
            else:
                index_count = len(indexes)
                total_indexes += index_count
                logger.info(
                    f"INDEX CREATED: {collection_name}: {index_count} indexes - {', '.join(indexes)}"
                )

        logger.info(f"Total indexes across all collections: {total_indexes}")
        logger.info("=== END INDEX SUMMARY ===")

    except Exception as e:
        logger.error(f"Error logging index summary: {str(e)}")
