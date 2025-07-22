"""
Follow-up Actions Node for the conversational graph.

This module provides functionality to suggest contextual follow-up actions
to users based on the conversation context and tool usage patterns.
"""

from typing import Dict, Any, List
from pydantic import BaseModel, Field
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from langgraph.config import get_stream_writer

from app.config.loggers import chat_logger as logger
from app.docstrings.langchain.tools.follow_up_actions_tool_docs import (
    SUGGEST_FOLLOW_UP_ACTIONS,
)
from app.langchain.llm.client import init_llm


class FollowUpActions(BaseModel):
    """Data structure for follow-up action suggestions."""

    actions: List[str] = Field(
        description="Array of 3-4 follow-up action suggestions for the user. Each action should be clear, actionable, contextually relevant, and under 50 characters."
    )


llm = init_llm(streaming=False)


async def follow_up_actions_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze conversation context and suggest relevant follow-up actions.

    This node runs after all other tool execution is complete to provide
    contextual suggestions for what the user might want to do next.

    Args:
        state: The current state of the conversation

    Returns:
        Empty dict indicating successful completion (follow-up actions are streamed, not stored in state)
    """
    try:
        messages = state.get("messages", [])
        # Skip if this is just an initial conversation setup or no messages
        if not messages or len(messages) < 2:
            logger.info("Skipping follow-up actions: insufficient message history")
            return {}

        # Create the parser for structured output
        parser = PydanticOutputParser(pydantic_object=FollowUpActions)

        # Create prompt with format instructions
        prompt = PromptTemplate(
            template=SUGGEST_FOLLOW_UP_ACTIONS,
            input_variables=["conversation_summary"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )

        # Initialize LLM

        # Create chain: prompt | model | parser
        chain = prompt | llm | parser

        # Create a summary of recent conversation for context
        recent_messages = messages[-4:] if len(messages) > 4 else messages
        conversation_summary = "\n".join(
            [
                f"{msg.type}: {msg.content[:200]}..."
                if len(msg.content) > 200
                else f"{msg.type}: {msg.content}"
                for msg in recent_messages
            ]
        )

        # Invoke chain and get structured output
        result = chain.invoke({"conversation_summary": conversation_summary})

        logger.info(f"Follow-up actions generated: {result.actions}")

        # Stream follow-up actions to frontend
        writer = get_stream_writer()
        writer({"follow_up_actions": result.actions})

        logger.info("Follow-up actions streamed successfully to frontend")

        # Return empty dict to indicate successful completion without state changes
        return {}

    except Exception as e:
        logger.error(f"Error in follow-up actions node: {e}")
        # Return empty dict instead of None to prevent state corruption
        return {}
