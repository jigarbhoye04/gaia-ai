"""
Mem0 LangChain Tools for memory management.

These tools allow agents to store, search, and retrieve memories,
enabling them to maintain context and learn from past interactions.
"""

from typing import Annotated, Dict, List, Optional

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool

from app.services.memory_service import memory_service


@tool
async def add_memory(
    content: Annotated[str, "Memory content to store"],
    metadata: Annotated[Optional[Dict], "Additional metadata for the memory"] = None,
    config: RunnableConfig = None,
) -> str:
    """
    Store a new memory with associated metadata.
    
    This tool stores important information for later retrieval. Use it to remember
    user preferences, key facts, or conversation history that may be relevant in future
    interactions.
    
    Args:
        content: The memory content to store
        metadata: Optional metadata to associate with the memory
        config: Runtime configuration containing user context
        
    Returns:
        Confirmation message with the memory ID
    """
    if not config:
        return "Error: Configuration required but not provided"
    
    metadata = metadata or {}
    user_id = config.get("metadata", {}).get("user_id")
    
    if not user_id:
        return "Error: User ID is required but not found in configuration"
    
    memory = await memory_service.store_memory(
        content=content,
        user_id=user_id,
        metadata=metadata
    )
    
    if not memory:
        return "Failed to store memory"
    
    return f"Memory stored successfully with ID: {memory.id}"


@tool
async def search_memory(
    query: Annotated[str, "Query string to search for"],
    limit: Annotated[int, "Maximum number of results to return"] = 5,
    config: RunnableConfig = None
) -> str:
    """
    Search stored memories using natural language queries.
    
    This tool enables retrieval of previously stored memories that are semantically
    similar to the query. Use it to recall relevant information from past interactions.
    
    Args:
        query: The search query text
        limit: Maximum number of results to return
        config: Runtime configuration containing user context
        
    Returns:
        Formatted string with search results
    """
    if not config:
        return "Error: Configuration required but not provided"
    
    user_id = config.get("metadata", {}).get("user_id")
    
    if not user_id:
        return "Error: User ID is required but not found in configuration"
    
    results = await memory_service.search_memories(
        query=query,
        user_id=user_id,
        limit=limit
    )
    
    if not results.memories:
        return "No matching memories found"
    
    # Format the results
    formatted_results = "Found the following memories:\n\n"
    for i, memory in enumerate(results.memories, 1):
        score = f" (score: {memory.relevance_score:.2f})" if memory.relevance_score else ""
        formatted_results += f"{i}. {memory.content}{score}\n\n"
    
    return formatted_results


@tool
async def get_all_memory(
    page: Annotated[int, "Page number for pagination"] = 1,
    page_size: Annotated[int, "Number of results per page"] = 10,
    config: RunnableConfig = None
) -> str:
    """
    Retrieve all memories matching specified criteria, with pagination.
    
    This tool returns all stored memories for the user, organized by pages.
    Use it to browse through the knowledge base when you need a comprehensive view.
    
    Args:
        page: Page number to retrieve (starting from 1)
        page_size: Number of results per page
        config: Runtime configuration containing user context
        
    Returns:
        Formatted string with paginated memory results
    """
    if not config:
        return "Error: Configuration required but not provided"
    
    user_id = config.get("metadata", {}).get("user_id")
    
    if not user_id:
        return "Error: User ID is required but not found in configuration"
    
    results = await memory_service.get_all_memories(
        user_id=user_id,
        page=page,
        page_size=page_size
    )
    
    if not results.memories:
        return "No memories found"
    
    # Format the results
    formatted_results = f"Showing page {page} of memories (total: {results.total_count}):\n\n"
    
    for i, memory in enumerate(results.memories, 1):
        formatted_results += f"{i}. {memory.content}\n\n"
    
    # Add pagination info
    if results.has_next:
        formatted_results += f"\nMore memories available. Use page={page+1} to see more."
    
    return formatted_results

