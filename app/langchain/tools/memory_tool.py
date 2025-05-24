"""Memory tools using Mem0 for persistent conversation memory."""

from typing import Dict, Optional

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool
from langgraph.config import get_stream_writer
from typing_extensions import Annotated

from app.config.loggers import llm_logger as logger
from app.memory.service import memory_service
from app.memory.utils import extract_user_id_from_context


@tool
async def create_memory(
    memory_content: Annotated[
        str,
        "The memory to store. This should be a clear, concise fact or preference about the user.",
    ],
    metadata: Annotated[
        Optional[Dict[str, str]],
        "Optional metadata about the memory (e.g., category: 'preference', 'personal_info', 'goal')",
    ] = None,
    config: RunnableConfig = None,
) -> str:
    """
    Store a specific memory about the user for future conversations.
    
    Use this when the user shares:
    - Personal preferences (e.g., "I prefer Python over JavaScript")
    - Personal information (e.g., "I'm allergic to peanuts")
    - Long-term goals or interests (e.g., "I'm planning a trip to Paris")
    - Important facts about their work or life
    
    Do NOT use this for:
    - Temporary information (e.g., meetings today)
    - General questions or requests
    - Information that belongs in calendar or notes
    """
    try:
        # Get stream writer for progress updates
        writer = get_stream_writer()

        # Extract user_id from config
        user_id = extract_user_id_from_context(config)
        
        if not user_id:
            logger.warning("Unable to create memory: User ID not found in config")
            return "Unable to create memory: User identification not available."

        # Send progress update
        writer({"progress": "Creating memory..."})

        # Store memory using the service
        memory_entry = await memory_service.store_memory(
            content=memory_content, user_id=user_id, metadata=metadata
        )

        if memory_entry:
            # Send success data
            logger.info("Sending memory creation success data via stream writer")
            writer(
                {
                    "memory_data": {
                        "operation": "create",
                        "status": "success",
                        "memory_id": memory_entry.id,
                        "content": memory_content,
                        "metadata": metadata,
                    }
                }
            )
            return f"Memory stored successfully: '{memory_content}'. I'll remember this for our future conversations."
        else:
            writer(
                {
                    "memory_data": {
                        "operation": "create",
                        "status": "failed",
                        "error": "Failed to store memory",
                    }
                }
            )
            return "Failed to store memory. Please try again later."

    except Exception as e:
        logger.error(f"Error creating memory: {e}")

        writer = get_stream_writer()

        writer(
            {"memory_data": {"operation": "create", "status": "error", "error": str(e)}}
        )
        return f"Failed to create memory: {str(e)}"


@tool
async def search_memories(
    query: Annotated[
        str,
        "The search query to find relevant memories",
    ],
    limit: Annotated[
        int,
        "Maximum number of memories to return (default: 5)",
    ] = 5,
    config: RunnableConfig = None,
) -> str:
    """
    Search through stored memories about the user.

    Use this to:
    - Recall user preferences when making recommendations
    - Remember personal information when relevant
    - Find context from previous conversations
    """
    try:
        # Get stream writer
        writer = get_stream_writer()

        # Extract user_id from config
        user_id = extract_user_id_from_context(config)

        if not user_id:
            logger.warning("Unable to search memories: User ID not found in config")
            return "Unable to search memories: User identification not available."

        writer({"progress": "Searching memories..."})

        # Search memories using the service
        search_result = await memory_service.search_memories(
            query=query,
            user_id=user_id,
            limit=limit
        )
        
        if not search_result.memories:
            writer(
                {
                    "memory_data": {
                        "operation": "search",
                        "status": "success",
                        "query": query,
                        "results": [],
                        "count": 0,
                    }
                }
            )
            return "No relevant memories found."

        # Format memories for stream and display
        memory_list = []
        formatted_memories = []

        for i, memory in enumerate(search_result.memories, 1):
            memory_list.append(
                {
                    "id": memory.id,
                    "content": memory.content,
                    "relevance_score": memory.relevance_score,
                    "metadata": memory.metadata,
                }
            )
            formatted_memories.append(f"{i}. {memory.content}")

        # Send search results
        writer(
            {
                "memory_data": {
                    "operation": "search",
                    "status": "success",
                    "query": query,
                    "results": memory_list,
                    "count": len(memory_list),
                }
            }
        )

        return "Found memories:\n" + "\n".join(formatted_memories)

    except Exception as e:
        logger.error(f"Error searching memories: {e}")
        writer(
            {"memory_data": {"operation": "search", "status": "error", "error": str(e)}}
        )
        return f"Failed to search memories: {str(e)}"


@tool
async def get_all_memories(
    page: Annotated[
        int,
        "Page number for pagination (default: 1)",
    ] = 1,
    page_size: Annotated[
        int,
        "Number of memories per page (default: 10)",
    ] = 10,
    config: RunnableConfig = None,
) -> str:
    """
    Retrieve all stored memories for the user with pagination.

    Use this to:
    - Show the user what you remember about them
    - Review stored preferences and information
    """
    try:
        # Get stream writer
        writer = get_stream_writer()

        # Extract user_id from config
        user_id = extract_user_id_from_context(config)

        if not user_id:
            logger.warning("Unable to retrieve memories: User ID not found in config")
            return "Unable to retrieve memories: User identification not available."

        # Send retrieval progress
        writer({"status": f"Fetching memories from page {page}/{page_size}..."})

        # Get all memories using the service
        memory_result = await memory_service.get_all_memories(
            user_id=user_id, page=page, page_size=page_size
        )

        if not memory_result.memories:
            writer(
                {
                    "memory_data": {
                        "operation": "list",
                        "status": "success",
                        "memories": [],
                        "page": page,
                        "total_count": 0,
                        "has_next": False,
                    }
                }
            )
            return "No memories found."

        # Format memories for stream and display
        memory_list = []
        formatted_memories = []

        for i, memory in enumerate(memory_result.memories, 1):
            memory_list.append(
                {
                    "id": memory.id,
                    "content": memory.content,
                    "metadata": memory.metadata,
                    "created_at": memory.created_at.isoformat()
                    if memory.created_at
                    else None,
                }
            )
            formatted_memories.append(f"{(page - 1) * page_size + i}. {memory.content}")

        # Send all memories data
        writer(
            {
                "memory_data": {
                    "operation": "list",
                    "status": "success",
                    "memories": memory_list,
                    "page": page,
                    "page_size": page_size,
                    "total_count": memory_result.total_count,
                    "has_next": memory_result.has_next,
                }
            }
        )

        result = f"Memories (Page {page}):\n" + "\n".join(formatted_memories)
        
        if memory_result.has_next:
            result += f"\n\nMore memories available. Use page={page+1} to see more."
            
        return result
        
    except Exception as e:
        logger.error(f"Error retrieving memories: {e}")
        writer(
            {"memory_data": {"operation": "list", "status": "error", "error": str(e)}}
        )
        return f"Failed to retrieve memories: {str(e)}"