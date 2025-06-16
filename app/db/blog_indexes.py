"""
Database indexes for blog collections.
"""

from app.config.loggers import blogs_logger as logger
from app.db.collections import blog_collection, team_collection


async def create_blog_indexes():
    """Create optimized indexes for blog and team collections."""
    try:
        # Blog collection indexes

        # Index for slug-based queries (most common)
        await blog_collection.create_index([("slug", 1)], unique=True)

        # Index for date-based sorting (for listing blogs)
        await blog_collection.create_index([("date", -1)])

        # Index for category-based filtering
        await blog_collection.create_index([("category", 1)])

        # Index for author-based queries
        await blog_collection.create_index([("authors", 1)])

        # Text index for search functionality
        await blog_collection.create_index(
            [
                ("title", "text"),
                ("content", "text"),
                ("description", "text"),
                ("tags", "text"),
            ]
        )

        # Compound index for published blogs sorting
        await blog_collection.create_index([("date", -1), ("category", 1)])

        # Team collection indexes (for author population)

        # Index for team member lookups by ObjectId (already handled by _id)
        # Index for team member name queries
        await team_collection.create_index([("name", 1)])

        # Index for role-based queries
        await team_collection.create_index([("role", 1)])

        logger.info("Successfully created blog indexes")

    except Exception as e:
        logger.error(f"Error creating blog indexes: {str(e)}")
        raise
