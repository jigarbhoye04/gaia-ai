"""Memory service layer for handling all memory operations."""

from typing import Any, Dict, Optional

from app.config.loggers import llm_logger as logger
from app.memory.client import get_memory_client
from app.memory.models import (
    ConversationMemory,
    MemoryEntry,
    MemorySearchResult,
)


class MemoryService:
    """Service class for managing memory operations."""
    
    def __init__(self):
        """Initialize the memory service."""
        self.client = get_memory_client()
        self.logger = logger
        
    def _validate_user_id(self, user_id: Optional[str]) -> Optional[str]:
        """
        Validate and return user_id.
        
        Args:
            user_id: User identifier
            
        Returns:
            Validated user_id or None
        """
        if not user_id:
            self.logger.warning("No user_id provided for memory operation")
            return None
        
        # Handle different user_id formats
        if isinstance(user_id, dict):
            # If user_id is accidentally a user object
            user_id = user_id.get("user_id") or user_id.get("id")
            
        return str(user_id) if user_id else None
    
    async def store_memory(
        self,
        content: str,
        user_id: Optional[str],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[MemoryEntry]:
        """
        Store a single memory.
        
        Args:
            content: Memory content to store
            user_id: User identifier
            metadata: Additional metadata
            
        Returns:
            MemoryEntry if successful, None otherwise
        """
        user_id = self._validate_user_id(user_id)
        if not user_id:
            return None
            
        try:
            result = self.client.add(
                messages=[{"role": "memory", "content": content}],
                user_id=user_id,
                metadata=metadata or {},
            )
            
            self.logger.info(f"Memory stored for user {user_id}: {result}")
            
            return MemoryEntry(
                id=result.get("id"),
                content=content,
                user_id=user_id,
                metadata=metadata or {},
            )
            
        except Exception as e:
            self.logger.error(f"Error storing memory: {e}")
            return None
    
    async def store_conversation(
        self, conversation: ConversationMemory
    ) -> bool:
        """
        Store a conversation exchange.
        
        Args:
            conversation: Conversation memory to store
            
        Returns:
            True if successful, False otherwise
        """
        user_id = self._validate_user_id(conversation.user_id)
        if not user_id:
            return False
            
        try:
            messages = [
                {"role": "user", "content": conversation.user_message},
                {"role": "assistant", "content": conversation.assistant_response},
            ]
            
            self.client.add(
                messages=messages,
                user_id=user_id,
                metadata={
                    "conversation_id": conversation.conversation_id,
                    **conversation.metadata,
                },
            )
            
            self.logger.info(f"Conversation stored for user {user_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error storing conversation: {e}")
            return False
    
    async def search_memories(
        self,
        query: str,
        user_id: Optional[str],
        limit: int = 5,
    ) -> MemorySearchResult:
        """
        Search for relevant memories.
        
        Args:
            query: Search query
            user_id: User identifier
            limit: Maximum number of results
            
        Returns:
            MemorySearchResult with matching memories
        """
        user_id = self._validate_user_id(user_id)
        if not user_id:
            return MemorySearchResult()
            
        try:
            results = self.client.search(
                query=query,
                user_id=user_id,
                limit=limit,
            )
            
            memories = []
            for result in results:
                memories.append(
                    MemoryEntry(
                        id=result.get("id"),
                        content=result.get("memory", ""),
                        user_id=user_id,
                        metadata=result.get("metadata", {}),
                        relevance_score=result.get("score"),
                    )
                )
            
            return MemorySearchResult(
                memories=memories,
                total_count=len(memories),
                page=1,
                page_size=limit,
            )
            
        except Exception as e:
            self.logger.error(f"Error searching memories: {e}")
            return MemorySearchResult()
    
    async def get_all_memories(
        self,
        user_id: Optional[str],
        page: int = 1,
        page_size: int = 10,
    ) -> MemorySearchResult:
        """
        Get all memories for a user with pagination.
        
        Args:
            user_id: User identifier
            page: Page number
            page_size: Results per page
            
        Returns:
            MemorySearchResult with user's memories
        """
        user_id = self._validate_user_id(user_id)
        if not user_id:
            return MemorySearchResult()
            
        try:
            result = self.client.get_all(
                user_id=user_id,
                page=page,
                page_size=page_size,
            )
            
            memories = []
            for memory_data in result.get("memories", []):
                memories.append(
                    MemoryEntry(
                        id=memory_data.get("id"),
                        content=memory_data.get("memory", ""),
                        user_id=user_id,
                        metadata=memory_data.get("metadata", {}),
                    )
                )
            
            return MemorySearchResult(
                memories=memories,
                total_count=result.get("total", len(memories)),
                page=page,
                page_size=page_size,
                has_next=result.get("has_next", False),
            )
            
        except Exception as e:
            self.logger.error(f"Error retrieving all memories: {e}")
            return MemorySearchResult()
    
    async def delete_memory(
        self, memory_id: str, user_id: Optional[str]
    ) -> bool:
        """
        Delete a specific memory.
        
        Args:
            memory_id: Memory identifier
            user_id: User identifier
            
        Returns:
            True if successful, False otherwise
        """
        user_id = self._validate_user_id(user_id)
        if not user_id:
            return False
            
        try:
            self.client.delete(memory_id=memory_id, user_id=user_id)
            self.logger.info(f"Memory {memory_id} deleted for user {user_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error deleting memory: {e}")
            return False


# Create singleton instance
memory_service = MemoryService()