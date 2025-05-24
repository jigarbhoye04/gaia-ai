"""Centralized memory client management."""

from functools import lru_cache
from typing import Optional

from mem0 import MemoryClient

from app.config.settings import settings


@lru_cache(maxsize=1)
def get_memory_client() -> MemoryClient:
    """
    Get or create a singleton Mem0 client instance.
    
    Returns:
        MemoryClient: Configured Mem0 client
    """
    return MemoryClient(
        api_key=settings.MEM0_API_KEY,
        org_id=settings.MEM0_ORG_ID,
        project_id=settings.MEM0_PROJECT_ID,
    )


class MemoryClientManager:
    """Manages memory client lifecycle and configuration."""
    
    def __init__(self):
        self._client: Optional[MemoryClient] = None
        
    @property
    def client(self) -> MemoryClient:
        """Get the memory client instance."""
        if self._client is None:
            self._client = get_memory_client()
        return self._client
    
    def reset(self):
        """Reset the client instance (useful for testing)."""
        self._client = None
        get_memory_client.cache_clear()


# Global instance
memory_client_manager = MemoryClientManager()