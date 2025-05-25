"""Memory service layer for handling all memory operations."""

from typing import Any, Dict, List, Optional

from app.config.loggers import llm_logger as logger
from app.memory.client import get_memory_client
from app.models.memory_models import (
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
    
    def _parse_memory_result(self, result: Dict[str, Any]) -> Optional[MemoryEntry]:
        """
        Parse a single memory result from Mem0 API response.
        
        Args:
            result: Memory result dictionary
            
        Returns:
            MemoryEntry or None if parsing fails
        """
        if not isinstance(result, dict):
            return None

        # Handle both memory structure formats
        content = (
            result.get("memory") or result.get("text") or result.get("content", "")
        )

        # Extract all the fields that match the output structure
        return MemoryEntry(
            id=result.get("id"),
            content=content,
            user_id=result.get("user_id", ""),
            metadata=result.get("metadata", {}),
            categories=result.get("categories", []),
            created_at=result.get("created_at"),
            updated_at=result.get("updated_at"),
            expiration_date=result.get("expiration_date"),
            internal_metadata=result.get("internal_metadata"),
            deleted_at=result.get("deleted_at"),
            relevance_score=result.get("score") or result.get("relevance_score"),
        )
    
    def _parse_memory_list(self, memories: List[Dict[str, Any]], user_id: str) -> List[MemoryEntry]:
        """
        Parse a list of memory results.
        
        Args:
            memories: List of memory dictionaries
            user_id: User ID to associate with memories
            
        Returns:
            List of MemoryEntry objects
        """
        parsed_memories = []
        for memory_data in memories:
            if memory_entry := self._parse_memory_result(memory_data):
                memory_entry.user_id = user_id
                parsed_memories.append(memory_entry)
        return parsed_memories
    
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
            # Store as a simple user message for mem0 to infer memory from
            result = self.client.add(
                messages=[{"role": "user", "content": content}],
                user_id=user_id,
                metadata=metadata or {},
                infer=True
            )
            
            self.logger.info(f"Memory stored for user {user_id}")
            
            # Mem0 cloud API returns a dict with 'results' array
            if not isinstance(result, dict) or "results" not in result:
                self.logger.warning(f"Unexpected response format from mem0: {result}")
                return None
                
            results = result.get("results", [])
            if not results:
                return None
                
            # Get the first result (usually only one when inferring)
            first_result = results[0]

            # Use the standardized parsing method for consistency
            memory_entry = self._parse_memory_result(first_result)

            # Ensure the user_id is set correctly
            if memory_entry:
                memory_entry.user_id = user_id
                # If the memory doesn't have content, use the original content
                if not memory_entry.content:
                    memory_entry.content = content
                # Ensure metadata is preserved
                if not memory_entry.metadata and metadata:
                    memory_entry.metadata = metadata

            return memory_entry
            
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
            
            metadata = {
                "conversation_id": conversation.conversation_id,
                **conversation.metadata,
            }
            
            self.client.add(
                messages=messages,
                user_id=user_id,
                metadata=metadata,
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
            
            # Mem0 cloud API returns dict with 'results' key
            if not isinstance(results, dict) or "results" not in results:
                self.logger.warning(f"Unexpected search result format: {results}")
                return MemorySearchResult()
            
            memories = self._parse_memory_list(results["results"], user_id)
            
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
            all_memories = self.client.get_all(user_id=user_id)

            # Log the raw response
            self.logger.info(f"Raw memory response: {all_memories}")

            memory_entries = []

            for memory in all_memories:
                memory_entry = self._parse_memory_result(memory)
                if memory_entry:
                    memory_entries.append(memory_entry)
            
            return MemorySearchResult(
                memories=memory_entries,
                total_count=len(memory_entries),
                page=page,
                page_size=page_size,
                has_next=len(memory_entries) > page * page_size,
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
            user_id: User identifier (for validation only)
            
        Returns:
            True if successful, False otherwise
        """
        user_id = self._validate_user_id(user_id)
        if not user_id:
            return False
            
        try:
            # Mem0 cloud API doesn't require user_id for delete
            self.client.delete(memory_id=memory_id)
            self.logger.info(f"Memory {memory_id} deleted for user {user_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error deleting memory {memory_id}: {e}")
            return False


# Create singleton instance
memory_service = MemoryService()