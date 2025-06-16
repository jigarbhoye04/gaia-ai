"""
Blog cache utilities for improved performance.
"""

from app.config.loggers import blogs_logger as logger


class BlogCache:
    """Blog caching utilities."""

    @staticmethod
    async def invalidate_all_blog_cache():
        """Invalidate all blog-related cache entries."""
        try:
            from app.db.redis import redis_cache

            # Get all blog-related cache keys
            keys_patterns = ["blogs:all:*", "blog:*"]

            all_keys = []
            for pattern in keys_patterns:
                keys = await redis_cache.redis.keys(pattern)
                all_keys.extend(keys)

            if all_keys:
                await redis_cache.redis.delete(*all_keys)
                logger.info(f"Invalidated {len(all_keys)} blog cache entries")

        except Exception as e:
            logger.error(f"Error invalidating blog cache: {e}")

    @staticmethod
    async def warm_blog_cache():
        """Pre-warm blog cache with frequently accessed data."""
        try:
            from app.services.blog_service import BlogService

            # Warm up first page of blogs
            await BlogService.get_all_blogs(page=1, limit=20)
            logger.info("Blog cache warmed up successfully")

        except Exception as e:
            logger.error(f"Error warming blog cache: {e}")


# Global cache instance
blog_cache = BlogCache()
