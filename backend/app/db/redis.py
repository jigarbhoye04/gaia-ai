import asyncio
import functools
import inspect
import json
from datetime import datetime
from typing import Any, Awaitable, Callable, Dict, Generic, List, Optional, TypeVar

import redis.asyncio as redis
from pydantic import BaseModel

from app.config.loggers import redis_logger as logger
from app.config.settings import settings

ONE_YEAR_TTL = 31_536_000
ONE_HOUR_TTL = 3600
CACHE_TTL = ONE_HOUR_TTL  # Default cache TTL for todos
STATS_CACHE_TTL = 30 * 60  # 30 minutes for stats (increased from 5)


class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime objects."""

    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)


class RedisCache:
    def __init__(self, redis_url="redis://localhost:6379", default_ttl=3600):
        self.redis_url = settings.REDIS_URL or redis_url
        self.default_ttl = default_ttl
        self.redis = None

        if self.redis_url:
            try:
                self.redis = redis.from_url(self.redis_url, decode_responses=True)
                logger.info("Redis connection initialized.")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
        else:
            logger.warning("REDIS_URL is not set. Caching will be disabled.")

    async def get(self, key: str):
        """
        Get a cached value by key.
        """
        if not self.redis:
            logger.warning("Redis is not initialized. Skipping get operation.")
            return None

        try:
            value = await self.redis.get(name=key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Error accessing Redis for key {key}: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: int = 3600):
        """
        Set a cached value with an optional TTL.
        """
        if not self.redis:
            logger.warning("Redis is not initialized. Skipping set operation.")
            return

        try:
            ttl = ttl or self.default_ttl

            # Handle Pydantic models
            if isinstance(value, BaseModel):
                # Use Pydantic's JSON encoder to handle datetime and other special types
                json_str = value.model_dump_json()
                await self.redis.setex(key, ttl, json_str)
            else:
                await self.redis.setex(key, ttl, json.dumps(value, cls=DateTimeEncoder))
        except Exception as e:
            logger.error(f"Error setting Redis key {key}: {e}")

    async def delete(self, key: str):
        """
        Delete a cached key.
        """
        if not self.redis:
            logger.warning("Redis is not initialized. Skipping delete operation.")
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


async def set_cache(key: str, value: Any, ttl: int = ONE_YEAR_TTL):
    """
    Set a cached value with an optional TTL.
    """
    await redis_cache.set(key, value, ttl)


async def delete_cache(key: str):
    """
    Delete a cached key.
    """
    # TODO: Optimize this
    if key.endswith("*"):
        await delete_cache_by_pattern(key)
        return

    await redis_cache.delete(key)


async def delete_cache_by_pattern(pattern: str):
    """
    Delete cached keys by pattern.
    """
    if not redis_cache.redis:
        logger.warning("Redis is not initialized. Skipping delete operation.")
        return

    try:
        keys = await redis_cache.redis.keys(pattern)
        if not keys:
            logger.info(f"No keys found for pattern: {pattern}")
            return
        for key in keys:
            await redis_cache.delete(key)
            logger.info(f"Cache deleted for key: {key}")
    except Exception as e:
        logger.error(f"Error deleting Redis keys by pattern {pattern}: {e}")


T = TypeVar("T")


class Cacheable(Generic[T]):
    """
    A decorator class that provides caching functionality with
    support for template-based keys and custom key generators.
    """

    def __init__(
        self,
        key_pattern: Optional[str] = None,
        key_generator: Optional[Callable] = None,
        key: Optional[str] = None,
        ttl: int = ONE_YEAR_TTL,
        serializer: Optional[Callable[[T], Any]] = None,
        deserializer: Optional[Callable[[Any], T]] = None,
    ):
        """
        Initialize the cache decorator.

        Args:
            key_pattern: Optional string template for the cache key (e.g. "{arg1}:{arg2}")
            key_generator: Optional custom function to generate cache keys
            ttl: Time-to-live for cache entries in seconds. None means no expiration
            key: Optional static key for caching
            serializer: Optional function to serialize the value before caching
            deserializer: Optional function to deserialize the value after retrieving from cache
        """
        self.key_pattern = key_pattern
        self.key_generator = key_generator
        self.key = key
        if not key and not key_pattern and not key_generator:
            raise ValueError(
                "Either key, key_pattern, or key_generator must be provided."
            )
        self.ttl = ttl
        self.serializer = serializer
        self.deserializer = deserializer

    def __call__(
        self, func: Callable[..., Awaitable[T]]
    ) -> Callable[..., Awaitable[T]]:
        """
        Apply the cache decorator to a function.

        Args:
            func: The function to be cached

        Returns:
            Wrapped function with caching behavior
        """

        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate the cache key
            if self.key:
                cache_key = self.key
            elif self.key_generator:
                cache_key = await self.key_generator(func.__name__, *args, **kwargs)
            else:
                if not self.key_pattern:
                    raise ValueError(
                        "key_pattern must be provided if key_generator is not used."
                    )

                func_signature = inspect.signature(func)
                bound_args = func_signature.bind(*args, **kwargs)
                bound_args.apply_defaults()

                cache_key = _pattern_to_key(
                    self.key_pattern, arguments=bound_args.arguments
                )

            # Check if the value is already cached
            cached_value = await get_cache(cache_key)
            if cached_value is not None:
                logger.info(f"Cache hit for key: {cache_key}")
                if self.deserializer:
                    cached_value = self.deserializer(cached_value)
                return cached_value

            # Call the original function and cache the result
            result = await func(*args, **kwargs)

            serialized_result = result
            if self.serializer:
                serialized_result = self.serializer(result)

            logger.info(f"Cache miss for key: {cache_key}")
            logger.info(f"Setting cache for key: {cache_key}")

            # Let set_cache handle Pydantic serialization
            await set_cache(key=cache_key, value=serialized_result, ttl=self.ttl)

            return result

        return wrapper


class CacheInvalidator:
    """
    A decorator class that provides cache invalidation functionality.
    """

    def __init__(
        self,
        key_patterns: Optional[List[str]] = None,
        key_generator: Optional[Callable] = None,
        key: Optional[str] = None,
    ):
        """
        Initialize the cache decorator.

        Args:
            key_pattern: Optional string template for the cache key (e.g. "{arg1}:{arg2}")
            key_generator: Optional custom function to generate cache keys
            ttl: Time-to-live for cache entries in seconds. None means no expiration
            key: Optional static key for caching
        """
        self.key_patterns = key_patterns
        self.key_generator = key_generator
        self.key = key
        if not key and not key_patterns and not key_generator:
            raise ValueError(
                "Either key, key_patterns, or key_generator must be provided."
            )

    def __call__(
        self, func: Callable[..., Awaitable[T]]
    ) -> Callable[..., Awaitable[T]]:
        """
        Apply the cache invalidator to a function.

        Args:
            func: The function to be invalidated

        Returns:
            Wrapped function with cache invalidation behavior
        """

        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate the cache key
            cache_keys: List[str] = []
            if self.key:
                cache_keys = [self.key]
            elif self.key_generator:
                cache_keys = [await self.key_generator(func.__name__, *args, **kwargs)]
            else:
                if not self.key_patterns:
                    raise ValueError(
                        "key_pattern must be provided if key_generator is not used."
                    )

                func_signature = inspect.signature(func)
                bound_args = func_signature.bind(*args, **kwargs)
                bound_args.apply_defaults()

                # Generate the cache key
                cache_keys = [
                    _pattern_to_key(pattern, arguments=bound_args.arguments)
                    for pattern in self.key_patterns
                ]

            logger.info(f"Cache invalidation for keys: {cache_keys}")

            # Invalidate the cache
            await asyncio.gather(*[delete_cache(key) for key in cache_keys])

            return await func(*args, **kwargs)

        return wrapper


def _pattern_to_key(pattern: str, arguments: Dict[str, Any]) -> str:
    """
    Convert a pattern string to a cache key by replacing placeholders with actual values.

    Args:
        pattern: The pattern string with placeholders
        kwargs: Keyword arguments to replace placeholders

    Returns:
        The generated cache key
    """
    try:
        return pattern.format(**arguments)
    except KeyError as e:
        raise ValueError(f"Missing key in pattern: {e}")
    except Exception as e:
        raise ValueError(f"Error generating key from pattern: {e}")
