"""
Subagent Tools - Tool-based Delegation Pattern

This module creates subagent invocation tools dynamically from OAuth integration configs.
Subagents are lazy-loaded on first invocation via providers.aget().
All metadata comes from oauth_config.py OAUTH_INTEGRATIONS.
"""

from datetime import datetime
from typing import Annotated, Optional

from app.config.loggers import common_logger as logger
from app.config.oauth_config import OAUTH_INTEGRATIONS, get_integration_by_id
from app.core.lazy_loader import providers
from app.helpers.agent_helpers import build_agent_config
from app.services.oauth_service import check_integration_status
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool
from langgraph.config import get_stream_writer

SUBAGENT_TOOL_DESCRIPTION_TEMPLATE = (
    "Delegate to the specialized {provider_name} agent for {domain} tasks. "
    "This expert agent handles: {capabilities}. "
    "Use for {use_cases}."
)


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

        return f"Integration {integration.name} is not connected. Please connect it first."

    except Exception as e:
        logger.error(f"Error checking integration status for {integration_id}: {e}")
        return None


def create_subagent_tool(integration_id: str):
    """Create a subagent invocation tool from OAuth integration configuration.

    Args:
        integration_id: Integration ID from OAUTH_INTEGRATIONS

    Returns:
        Tool function that invokes the subagent graph, or None if integration has no subagent
    """
    integration = get_integration_by_id(integration_id)
    if not integration or not integration.subagent_config:
        logger.debug(f"Integration {integration_id} has no subagent configuration")
        return None

    if not integration.subagent_config.has_subagent:
        return None

    subagent_cfg = integration.subagent_config
    tool_name = subagent_cfg.handoff_tool_name
    agent_name = subagent_cfg.agent_name
    system_prompt = subagent_cfg.system_prompt or ""

    description = SUBAGENT_TOOL_DESCRIPTION_TEMPLATE.format(
        provider_name=integration.name,
        domain=subagent_cfg.domain,
        capabilities=subagent_cfg.capabilities,
        use_cases=subagent_cfg.use_cases,
    )

    @tool(tool_name, description=description)
    async def subagent_tool(
        task: Annotated[
            str,
            "Description of what the agent should do, including all relevant context.",
        ],
        config: RunnableConfig,
    ) -> str:
        """Invoke subagent graph and return result."""
        try:
            configurable = config.get("configurable", {})
            user_id = configurable.get("user_id")

            if user_id:
                error_message = await check_integration_connection(
                    integration_id, user_id
                )
                if error_message:
                    return error_message

            subagent_graph = await providers.aget(agent_name)
            if not subagent_graph:
                return f"Error: {agent_name} not available"

            thread_id = configurable.get("thread_id", "")
            subagent_thread_id = f"{integration_id}_{thread_id}"

            user = {
                "user_id": user_id,
                "email": configurable.get("email"),
                "name": configurable.get("user_name"),
            }
            user_time_str = configurable.get("user_time", "")
            user_time = (
                datetime.fromisoformat(user_time_str)
                if user_time_str
                else datetime.now()
            )

            subagent_runnable_config = build_agent_config(
                conversation_id=thread_id,
                user=user,
                user_time=user_time,
                thread_id=subagent_thread_id,
            )

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

            writer = get_stream_writer()
            final_response = ""

            async for event in subagent_graph.astream(
                initial_state,
                stream_mode=["messages", "custom"],
                config=subagent_runnable_config,
                subgraphs=True,
            ):
                ns, stream_mode, payload = event

                if stream_mode == "custom":
                    writer(payload)

                if stream_mode == "messages":
                    message, metadata = payload
                    if hasattr(message, "content") and message.content:
                        if isinstance(message.content, str):
                            final_response = message.content

            return final_response or "Task completed"

        except Exception as e:
            logger.error(f"Error calling {agent_name}: {e}")
            return f"Error executing task: {str(e)}"

    return subagent_tool


def get_subagent_tools(enabled_providers: list[str] | None = None):
    """Get subagent invocation tools from OAuth integration configs.

    Args:
        enabled_providers: Optional list of integration IDs to filter by.
                          If None, returns all integrations with subagents.

    Returns:
        List of tools that invoke subagent graphs
    """
    tools = []

    for integration in OAUTH_INTEGRATIONS:
        if enabled_providers and integration.id not in enabled_providers:
            continue

        if (
            not integration.subagent_config
            or not integration.subagent_config.has_subagent
        ):
            continue

        subagent_tool = create_subagent_tool(integration.id)
        if subagent_tool:
            tools.append(subagent_tool)

    logger.info(f"Created {len(tools)} subagent tools from integration configs")
    return tools


# Backward compatibility aliases
create_handoff_tool = create_subagent_tool
get_handoff_tools = get_subagent_tools
