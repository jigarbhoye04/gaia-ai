import redis.asyncio as redis
import json

from app.config.settings import settings
from app.config.loggers import redis_logger as logger


ONE_YEAR_TTL = 31_536_000
ONE_HOUR_TTL = 3600


class RedisCache:
    def __init__(self, redis_url="redis://localhost:6379", default_ttl=3600):
        self.redis_url = settings.REDIS_URL or redis_url
        self.default_ttl = default_ttl
        self.redis = None

        if self.redis_url:
            try:
                self.redis = redis.from_url(self.redis_url, decode_responses=True)
                logger.info("REDIS: Redis connection initialized.")
            except Exception as e:
                logger.error(f"REDIS: Failed to connect to Redis: {e}")
        else:
            logger.warning("REDIS: REDIS_URL is not set. Caching will be disabled.")

    async def get(self, key: str):
        """
        Get a cached value by key.
        """
        if not self.redis:
            logger.warning("REDIS: Redis is not initialized. Skipping get operation.")
            return None

        try:
            value = await self.redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Error accessing Redis for key {key}: {e}")
            return None

    async def set(self, key: str, value: dict, ttl: int = 3600):
        """
        Set a cached value with an optional TTL.
        """
        if not self.redis:
            logger.warning("REDIS: Redis is not initialized. Skipping set operation.")
            return

        try:
            ttl = ttl or self.default_ttl
            await self.redis.setex(key, ttl, json.dumps(value))
        except Exception as e:
            logger.error(f"Error setting Redis key {key}: {e}")

    async def delete(self, key: str):
        """
        Delete a cached key.
        """
        if not self.redis:
            logger.warning(
                "REDIS: Redis is not initialized. Skipping delete operation."
            )
            return

        try:
            await self.redis.delete(key)
            logger.info(f"Cache deleted for key: {key}")
        except Exception as e:
            logger.error(f"Error deleting Redis key {key}: {e}")


# Initialize the Redis cache
redis_cache = RedisCache()


# Wrappers for RedisCache instance methods
async def get_cache(key: str):
    """
    Get a cached value by key.
    """
    return await redis_cache.get(key)


async def set_cache(key: str, value: dict, ttl: int = ONE_YEAR_TTL):
    """
    Set a cached value with an optional TTL.
    """
    await redis_cache.set(key, value, ttl)


async def delete_cache(key: str):
    """
    Delete a cached key.
    """
    await redis_cache.delete(key)
