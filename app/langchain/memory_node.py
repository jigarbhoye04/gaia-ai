"""Memory node for LangGraph integration with Mem0."""

import logging

from langchain_core.messages import SystemMessage

from app.langchain.state import State
from app.memory.models import ConversationMemory
from app.memory.service import memory_service

logger = logging.getLogger(__name__)


class MemoryNode:
    """Handles memory operations in the LangGraph workflow."""

    def __init__(self):
        """Initialize with memory service."""
        self.service = memory_service

    async def retrieve_memories(self, state: State) -> State:
        """
        Retrieve relevant memories based on the current conversation context.
        
        Args:
            state: Current graph state
            
        Returns:
            Updated state with retrieved memories
        """
        try:
            # Try to get user_id from different sources
            user_id = state.get("mem0_user_id")
            
            # If not in state, try from config metadata
            if not user_id and hasattr(state, 'get'):
                config = state.get("config", {})
                configurable = config.get("configurable", {})
                user_id = configurable.get("user_id")
            
            if not user_id:
                logger.debug("No user_id found for memory retrieval - skipping memory search")
                return state

            # Get the last user message
            messages = state.get("messages", [])
            if not messages:
                return state

            last_message = messages[-1].content if messages else ""

            # Search for relevant memories using the service
            search_result = await self.service.search_memories(
                query=last_message,
                user_id=user_id,
                limit=5
            )

            # Extract memory content
            memory_context = [mem.content for mem in search_result.memories]

            # Update state with memories
            state["memories"] = memory_context
            
            # Add memory context to messages as a system message if memories exist
            if memory_context:
                context_message = SystemMessage(
                    content="Relevant information from previous conversations:\n" + 
                           "\n".join(f"- {mem}" for mem in memory_context)
                )
                # Insert context before the last user message
                state["messages"].insert(-1, context_message)

            return state

        except Exception as e:
            logger.error(f"Error retrieving memories: {e}")
            return state

    async def store_conversation(self, state: State) -> State:
        """
        Store important parts of the conversation in memory.
        
        Args:
            state: Current graph state
            
        Returns:
            Updated state
        """
        try:
            # Try to get user_id from different sources
            user_id = state.get("mem0_user_id")
            
            # If not in state, try from config metadata
            if not user_id and hasattr(state, 'get'):
                config = state.get("config", {})
                configurable = config.get("configurable", {})
                user_id = configurable.get("user_id")
                
            if not user_id:
                logger.debug("No user_id found for memory storage - skipping")
                return state

            messages = state.get("messages", [])
            if len(messages) < 2:  # Need at least user and assistant messages
                return state

            # Get the last exchange (user message and assistant response)
            conversation_pairs = []
            for i in range(len(messages) - 1):
                if messages[i].type == "human" and messages[i + 1].type == "ai":
                    conversation_pairs.append({
                        "user": messages[i].content,
                        "assistant": messages[i + 1].content
                    })

            # Store the last conversation pair
            if conversation_pairs:
                last_pair = conversation_pairs[-1]
                
                # Create conversation memory
                conversation = ConversationMemory(
                    user_message=last_pair["user"],
                    assistant_response=last_pair["assistant"],
                    conversation_id=state.get("conversation_id", ""),
                    user_id=user_id,
                    metadata={
                        "timestamp": state.get("current_datetime"),
                    }
                )
                
                # Store using the service
                success = await self.service.store_conversation(conversation)
                
                if success:
                    logger.info(f"Conversation stored for user {user_id}")
                else:
                    logger.warning("Failed to store conversation")

            # Mark that memories have been stored
            state["memories_stored"] = True
            
            return state

        except Exception as e:
            logger.error(f"Error storing conversation memory: {e}")
            return state


# Create singleton instance
memory_node = MemoryNode()


# Node functions for the graph
async def retrieve_memories_node(state: State) -> State:
    """Node function to retrieve memories."""
    return await memory_node.retrieve_memories(state)


async def store_memories_node(state: State) -> State:
    """Node function to store memories."""
    return await memory_node.store_conversation(state)