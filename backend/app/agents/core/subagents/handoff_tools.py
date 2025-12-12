"""
Subagent Tools - Consolidated Delegation Pattern

This module provides two tools for subagent delegation:
1. search_subagents - Semantic search for available subagents
2. handoff - Generic handoff tool that delegates to any subagent

Subagents are lazy-loaded on first invocation via providers.aget().
All metadata comes from oauth_config.py OAUTH_INTEGRATIONS.
"""

from datetime import datetime
from typing import Annotated, List, Optional, TypedDict

from app.config.loggers import common_logger as logger
from app.config.oauth_config import OAUTH_INTEGRATIONS, get_integration_by_id
from app.core.lazy_loader import providers
from app.helpers.agent_helpers import build_agent_config
from app.services.oauth_service import (
    check_integration_status,
    check_multiple_integrations_status,
)
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool
from langgraph.config import get_stream_writer
from langgraph.store.base import BaseStore

SUBAGENTS_NAMESPACE = ("subagents",)


class SubagentInfo(TypedDict):
    """Subagent information structure."""

    id: str
    name: str
    connected: bool


async def check_integration_connection(
    integration_id: str,
    user_id: str,
) -> Optional[str]:
    """Check if integration is connected and return error message if not."""
    try:
        integration = get_integration_by_id(integration_id)
        if not integration:
            return None

        is_connected = await check_integration_status(integration_id, user_id)

        if is_connected:
            return None

        writer = get_stream_writer()
        writer({"progress": f"Checking {integration.name} connection..."})

        integration_data = {
            "integration_id": integration.id,
            "message": f"To use {integration.name} features, please connect your account first.",
        }

        writer({"integration_connection_required": integration_data})

        return (
            f"Integration {integration.name} is not connected. Please connect it first."
        )

    except Exception as e:
        logger.error(f"Error checking integration status for {integration_id}: {e}")
        return None


def _get_subagent_integrations() -> List:
    """Get all integrations that have subagent configurations."""
    return [
        integration
        for integration in OAUTH_INTEGRATIONS
        if integration.subagent_config and integration.subagent_config.has_subagent
    ]


def _get_subagent_by_id(subagent_id: str):
    """Get subagent integration by ID or short_name."""
    search_id = subagent_id.lower().strip()
    for integ in OAUTH_INTEGRATIONS:
        if integ.id.lower() == search_id or (
            integ.short_name and integ.short_name.lower() == search_id
        ):
            if integ.subagent_config and integ.subagent_config.has_subagent:
                return integ
    return None


async def index_subagents_to_store(store: BaseStore) -> None:
    """Index all subagents into the store for semantic search with rich descriptions."""
    from langgraph.store.base import PutOp

    subagent_integrations = _get_subagent_integrations()

    put_ops = []
    for integration in subagent_integrations:
        cfg = integration.subagent_config
        # Create comprehensive description with provider name mentioned multiple times
        # for better semantic matching
        provider_name = integration.name
        short_name = integration.short_name or integration.id
        
        description = (
            f"{provider_name} ({short_name}). "
            f"{provider_name} specializes in {cfg.domain}. "
            f"Use {provider_name} for: {cfg.use_cases}. "
            f"{provider_name} capabilities: {cfg.capabilities}"
        )

        put_ops.append(
            PutOp(
                namespace=SUBAGENTS_NAMESPACE,
                key=integration.id,
                value={
                    "id": integration.id,
                    "name": integration.name,
                    "description": description,
                },
                index=["description"],
            )
        )

    if put_ops:
        await store.abatch(put_ops)
        logger.info(f"Indexed {len(put_ops)} subagents to store")


@tool
async def search_subagents(
    query: Annotated[
        str,
        "Search query for the provider/service (e.g., 'email', 'calendar', 'notion', 'twitter').",
    ],
    config: RunnableConfig,
) -> List[SubagentInfo] | str:
    """Search for specialized subagents by provider or capability.

    Use this to find which subagent can handle a task before using handoff.
    Returns top matching subagents with id, name, and connection status.

    Args:
        query: Provider or capability to search for (e.g., "email", "calendar", "social")
    """
    try:
        configurable = config.get("configurable", {})
        user_id = configurable.get("user_id") if configurable else None
        if not user_id:
            return "Error: User ID not found in configuration."

        store = await providers.aget("chroma_tools_store")
        if not store:
            return "Error: Search store not available."

        search_results = await store.asearch(SUBAGENTS_NAMESPACE, query=query, limit=3)

        if not search_results:
            return []

        integration_ids = [r.key for r in search_results]
        status_map = await check_multiple_integrations_status(integration_ids, user_id)

        results: List[SubagentInfo] = []
        for result in search_results:
            results.append(
                {
                    "id": result.key,
                    "name": result.value.get("name", result.key),
                    "connected": status_map.get(result.key, False),
                }
            )

        return results

    except Exception as e:
        logger.error(f"Error searching subagents: {e}")
        return f"Error searching subagents: {str(e)}"


@tool
async def handoff(
    subagent_id: Annotated[
        str,
        "The ID of the subagent to delegate to (e.g., 'gmail', 'subagent:gmail', 'google_calendar'). "
        "Get this from retrieve_tools results (subagent IDs have 'subagent:' prefix).",
    ],
    task: Annotated[
        str,
        "Detailed description of the task for the subagent, including all relevant context.",
    ],
    config: RunnableConfig,
) -> str:
    """Delegate a task to a specialized subagent.

    Use this tool to hand off tasks to expert subagents that specialize in specific domains.
    First use retrieve_tools to find available subagents (they appear with 'subagent:' prefix).

    The subagent will:
    1. Process the task using its specialized tools
    2. Return the result of the completed task

    Args:
        subagent_id: ID of the subagent from retrieve_tools (with or without 'subagent:' prefix)
        task: Complete task description with all necessary context
    """
    try:
        configurable = config.get("configurable", {})
        user_id = configurable.get("user_id")

        # Strip 'subagent:' prefix if present
        clean_id = subagent_id.replace("subagent:", "").strip()
        
        integration = _get_subagent_by_id(clean_id)

        if not integration or not integration.subagent_config:
            available = [i.id for i in _get_subagent_integrations()][:5]
            return (
                f"Subagent '{subagent_id}' not found. "
                f"Use retrieve_tools to find available subagents. "
                f"Examples: {', '.join([f'subagent:{a}' for a in available])}{'...' if len(available) == 5 else ''}"
            )

        subagent_cfg = integration.subagent_config
        agent_name = subagent_cfg.agent_name

        if user_id:
            error_message = await check_integration_connection(integration.id, user_id)
            if error_message:
                return error_message

        subagent_graph = await providers.aget(agent_name)
        if not subagent_graph:
            return f"Error: {agent_name} not available"

        thread_id = configurable.get("thread_id", "")
        subagent_thread_id = f"{integration.id}_{thread_id}"

        user = {
            "user_id": user_id,
            "email": configurable.get("email"),
            "name": configurable.get("user_name"),
        }
        user_time_str = configurable.get("user_time", "")
        user_time = (
            datetime.fromisoformat(user_time_str) if user_time_str else datetime.now()
        )

        subagent_runnable_config = build_agent_config(
            conversation_id=thread_id,
            user=user,
            user_time=user_time,
            thread_id=subagent_thread_id,
        )

        system_prompt = subagent_cfg.system_prompt or ""
        system_message = SystemMessage(
            content=system_prompt,
            additional_kwargs={"visible_to": {agent_name}},
        )

        initial_state = {
            "messages": [
                system_message,
                HumanMessage(
                    content=task,
                    additional_kwargs={"visible_to": {agent_name}},
                ),
            ]
        }

        result = await subagent_graph.ainvoke(
            initial_state,
            config=subagent_runnable_config,
        )

        messages = result.get("messages", [])
        if messages:
            last_message = messages[-1]
            if hasattr(last_message, "content") and last_message.content:
                return str(last_message.content)

        return "Task completed"

    except Exception as e:
        logger.error(f"Error in handoff to {subagent_id}: {e}")
        return f"Error executing task: {str(e)}"


# Consolidated tools list - only handoff is exposed as a core tool
# Subagent discovery happens via retrieve_tools
tools = [handoff]


# Backward compatibility - deprecated functions
def create_subagent_tool(integration_id: str):
    """Deprecated: Use handoff tool instead."""
    logger.warning(
        "create_subagent_tool is deprecated. Use the consolidated handoff tool."
    )
    return None


def get_subagent_tools(enabled_providers: list[str] | None = None):
    """Deprecated: Use tools list instead."""
    logger.warning("get_subagent_tools is deprecated. Use handoff_tools.tools instead.")
    return tools


# Backward compatibility aliases
create_handoff_tool = create_subagent_tool
get_handoff_tools = get_subagent_tools
