import redis.asyncio as redis
import json
import logging
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class RedisCache:
    def __init__(self, redis_url="redis://localhost:6379", default_ttl=3600):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        if not self.redis_url:
            raise ValueError("REDIS_URL must be set in the environment.")
        self.default_ttl = default_ttl
        self.redis = redis.from_url(self.redis_url, decode_responses=True)

    async def get(self, key: str):
        """
        Get a cached value by key.
        """
        try:
            value = await self.redis.get(key)
            if value:
                logger.info(f"Cache hit for key: {key}")
                return json.loads(value)
            logger.info(f"Cache miss for key: {key}")
            return None
        except Exception as e:
            logger.error(f"Error accessing Redis for key {key}: {e}")
            return None

    async def set(self, key: str, value: dict, ttl: int = 3600):
        """
        Set a cached value with an optional TTL.
        """
        try:
            ttl = ttl or self.default_ttl
            await self.redis.setex(key, ttl, json.dumps(value))
            logger.info(f"Cache set for key: {key} with TTL: {ttl}")
        except Exception as e:
            logger.error(f"Error setting Redis key {key}: {e}")

    async def delete(self, key: str):
        """
        Delete a cached key.
        """
        try:
            await self.redis.delete(key)
            logger.info(f"Cache deleted for key: {key}")
        except Exception as e:
            logger.error(f"Error deleting Redis key {key}: {e}")


# Initialize the Redis cache
redis_cache = RedisCache()
