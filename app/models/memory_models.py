"""Memory-related data models."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class Message(BaseModel):
    """Represents a single message in a conversation."""
    role: str = Field(description="Role of the message sender (user, assistant, system)")
    content: str = Field(description="Content of the message")
    timestamp: Optional[datetime] = Field(default=None, description="When the message was created")


class MemoryEntry(BaseModel):
    """Represents a single memory entry."""
    id: Optional[str] = Field(default=None, description="Unique identifier for the memory")
    content: str = Field(description="The memory content")
    user_id: str = Field(description="User ID associated with this memory")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    created_at: Optional[datetime] = Field(default=None, description="When the memory was created")
    updated_at: Optional[datetime] = Field(default=None, description="When the memory was last updated")
    relevance_score: Optional[float] = Field(default=None, description="Relevance score from search")


class MemorySearchResult(BaseModel):
    """Results from memory search operation."""
    memories: List[MemoryEntry] = Field(default_factory=list, description="List of matching memories")
    total_count: int = Field(default=0, description="Total number of matching memories")
    page: int = Field(default=1, description="Current page number")
    page_size: int = Field(default=10, description="Number of results per page")
    has_next: bool = Field(default=False, description="Whether there are more results")


class MemoryConfiguration(BaseModel):
    """Configuration for memory operations."""
    max_memories_per_search: int = Field(default=5, description="Maximum memories to retrieve per search")
    auto_store_conversations: bool = Field(default=True, description="Automatically store conversations")
    memory_ttl_days: Optional[int] = Field(default=None, description="Days to retain memories (None = forever)")
    enable_semantic_search: bool = Field(default=True, description="Use semantic search for memory retrieval")


class ConversationMemory(BaseModel):
    """Represents a conversation to be stored in memory."""
    user_message: str = Field(description="The user's message")
    assistant_response: str = Field(description="The assistant's response")
    conversation_id: str = Field(description="Conversation thread ID")
    user_id: str = Field(description="User ID")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional context")


class AddMemoryInput(BaseModel):
    """Input model for adding memories via API."""
    messages: List[Message] = Field(description="Messages to add to memory")
    user_id: str = Field(description="User ID for the memories")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")