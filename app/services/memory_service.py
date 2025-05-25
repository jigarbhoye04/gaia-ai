"""Memory service layer for handling all memory operations."""

from typing import Any, Dict, Optional

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
                infer=True  # Let mem0 infer and extract the memory
            )
            
            self.logger.info(f"Memory stored for user {user_id}: {result}")
            
            # Handle different response formats from mem0
            if isinstance(result, dict):
                memory_id = result.get("id") or result.get("results", [{}])[0].get("id")
                # The actual inferred memory might be different from input
                inferred_content = result.get("memory", content)
                if "results" in result and result["results"]:
                    inferred_content = result["results"][0].get("memory", content)
            else:
                memory_id = None
                inferred_content = content
            
            return MemoryEntry(
                id=memory_id,
                content=inferred_content,
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
            # Handle both list and dict response formats
            if isinstance(results, dict):
                results_list = results.get("results", [])
            elif isinstance(results, list):
                results_list = results
            else:
                self.logger.warning(f"Unexpected search result type: {type(results)}")
                results_list = []
            
            for result in results_list:
                if isinstance(result, dict):
                    memory_content = (
                        result.get("memory") or 
                        result.get("text") or 
                        result.get("content") or
                        str(result)
                    )
                    memory_id = result.get("id") or result.get("hash")
                    memory_metadata = result.get("metadata", {})
                    relevance_score = result.get("score") or result.get("relevance_score")
                else:
                    memory_content = str(result)
                    memory_id = None
                    memory_metadata = {}
                    relevance_score = None
                
                memories.append(
                    MemoryEntry(
                        id=memory_id,
                        content=memory_content,
                        user_id=user_id,
                        metadata=memory_metadata,
                        relevance_score=relevance_score,
                    )
                )
            
            return MemorySearchResult(
                memories=memories,
                total_count=len(memories),
                page=1,
                page_size=limit,
            )
            
        except Exception as e:
            self.logger.error(f"Error searching memories: {e}, user_id: {user_id}")
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
            # Mem0 get_all returns a list directly, not a dict
            result = self.client.get_all(user_id=user_id)
            
            # Handle pagination manually since mem0 doesn't support it in get_all
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            
            # If result is a dict with 'memories' key (newer mem0 versions)
            if isinstance(result, dict):
                all_memories = result.get("memories", [])
            # If result is a list directly (older mem0 versions)
            elif isinstance(result, list):
                all_memories = result
            else:
                self.logger.warning(f"Unexpected result type from mem0: {type(result)}")
                all_memories = []
            
            # Paginate the results
            paginated_memories = all_memories[start_idx:end_idx]
            
            memories = []
            for memory_data in paginated_memories:
                # Handle different memory data formats
                if isinstance(memory_data, dict):
                    memory_content = (
                        memory_data.get("memory") or 
                        memory_data.get("text") or 
                        memory_data.get("content") or
                        str(memory_data)
                    )
                    memory_id = memory_data.get("id") or memory_data.get("hash")
                    memory_metadata = memory_data.get("metadata", {})
                else:
                    # If it's a string or other type, convert to string
                    memory_content = str(memory_data)
                    memory_id = None
                    memory_metadata = {}
                
                memories.append(
                    MemoryEntry(
                        id=memory_id,
                        content=memory_content,
                        user_id=user_id,
                        metadata=memory_metadata,
                    )
                )
            
            total_count = len(all_memories)
            has_next = end_idx < total_count
            
            return MemorySearchResult(
                memories=memories,
                total_count=total_count,
                page=page,
                page_size=page_size,
                has_next=has_next,
            )
            
        except Exception as e:
            self.logger.error(f"Error retrieving all memories: {e}, user_id: {user_id}")
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