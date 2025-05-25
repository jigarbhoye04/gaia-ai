"""
Database indexes for todo collections.
"""

from app.config.loggers import todos_logger
from app.db.collections import todos_collection, projects_collection


async def create_todo_indexes():
    """Create indexes for todos and projects collections."""
    try:
        # Todos collection indexes
        # Compound index for user queries with sorting
        await todos_collection.create_index([("user_id", 1), ("created_at", -1)])
        
        # Index for project-based queries
        await todos_collection.create_index([("user_id", 1), ("project_id", 1)])
        
        # Index for due date queries
        await todos_collection.create_index([("user_id", 1), ("due_date", 1)])
        
        # Index for completion status
        await todos_collection.create_index([("user_id", 1), ("completed", 1)])
        
        # Index for priority queries
        await todos_collection.create_index([("user_id", 1), ("priority", 1)])
        
        # Text index for search functionality
        await todos_collection.create_index([("title", "text"), ("description", "text")])
        
        # Projects collection indexes
        # Index for user queries
        await projects_collection.create_index([("user_id", 1), ("created_at", -1)])
        
        # Index for default project lookup
        await projects_collection.create_index([("user_id", 1), ("is_default", 1)])
        
        todos_logger.info("Successfully created todo indexes")
        
    except Exception as e:
        todos_logger.error(f"Error creating todo indexes: {str(e)}")
        raise