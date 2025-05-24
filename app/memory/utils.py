"""Utility functions for memory operations."""

from typing import Any, Dict, List, Optional

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage


def extract_user_id_from_context(context: Dict[str, Any]) -> Optional[str]:
    """
    Extract user_id from various context sources.
    
    Args:
        context: Context dictionary that may contain user information
        
    Returns:
        User ID if found, None otherwise
    """
    if not context:
        return None
        
    # Handle RunnableConfig structure
    if "configurable" in context:
        configurable = context.get("configurable", {})
        if user_id := configurable.get("user_id"):
            return str(user_id)
    
    # Direct user_id
    if user_id := context.get("user_id"):
        return str(user_id)
    
    # From user object
    if user := context.get("user"):
        if isinstance(user, dict):
            return str(user.get("user_id") or user.get("id") or "")
    
    # From metadata
    if metadata := context.get("metadata"):
        if isinstance(metadata, dict):
            return str(metadata.get("user_id") or "")
    
    return None


def format_memories_for_context(memories: List[str], max_memories: int = 5) -> str:
    """
    Format memories into a context string.
    
    Args:
        memories: List of memory strings
        max_memories: Maximum number of memories to include
        
    Returns:
        Formatted context string
    """
    if not memories:
        return ""
    
    # Limit memories
    memories = memories[:max_memories]
    
    context = "Based on our previous conversations, I remember:\n"
    for i, memory in enumerate(memories, 1):
        context += f"{i}. {memory}\n"
    
    return context.strip()


def should_store_conversation(messages: List[Any]) -> bool:
    """
    Determine if a conversation should be stored in memory.
    
    Args:
        messages: List of messages in the conversation
        
    Returns:
        True if conversation should be stored
    """
    if len(messages) < 2:
        return False
    
    # Check if there's meaningful content
    has_user_message = any(
        isinstance(msg, HumanMessage) and len(msg.content.strip()) > 10
        for msg in messages
    )
    
    has_ai_response = any(
        isinstance(msg, AIMessage) and len(msg.content.strip()) > 10
        for msg in messages
    )
    
    # Don't store if it's just greetings or very short exchanges
    trivial_patterns = [
        "hello", "hi", "hey", "thanks", "thank you", "bye", 
        "goodbye", "ok", "okay", "yes", "no"
    ]
    
    last_user_msg = next(
        (msg.content.lower().strip() for msg in reversed(messages) 
         if isinstance(msg, HumanMessage)), 
        ""
    )
    
    if last_user_msg in trivial_patterns:
        return False
    
    return has_user_message and has_ai_response


def extract_key_information(content: str) -> Optional[str]:
    """
    Extract key information from content that should be remembered.
    
    Args:
        content: Raw content string
        
    Returns:
        Extracted key information or None
    """
    # Keywords that indicate important information
    memory_keywords = [
        "prefer", "like", "love", "hate", "allergic", "intolerant",
        "my name is", "i am", "i work", "i live", "my goal",
        "remember", "don't forget", "keep in mind", "note that"
    ]
    
    content_lower = content.lower()
    
    # Check if content contains memory-worthy keywords
    if any(keyword in content_lower for keyword in memory_keywords):
        # Clean and return the content
        return content.strip()
    
    return None


def sanitize_memory_content(content: str) -> str:
    """
    Sanitize memory content by removing sensitive information.
    
    Args:
        content: Raw memory content
        
    Returns:
        Sanitized content
    """
    # Remove potential sensitive patterns
    import re
    
    # Remove email addresses
    content = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', content)
    
    # Remove phone numbers (basic pattern)
    content = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', content)
    
    # Remove credit card patterns
    content = re.sub(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b', '[CARD]', content)
    
    # Remove SSN patterns
    content = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN]', content)
    
    return content