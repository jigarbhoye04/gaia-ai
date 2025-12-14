import asyncio
from typing import Annotated, Awaitable, Callable, Optional, TypedDict

from langgraph.prebuilt import InjectedStore
from langgraph.store.base import BaseStore


class RetrieveToolsResult(TypedDict):
    """Result from retrieve_tools function.

    Attributes:
        tools_to_bind: Tool IDs to actually bind to the model (for execution)
        response: Tool names/info to return to the agent (for display)
    """

    tools_to_bind: list[str]
    response: list[str]


def get_retrieve_tools_function(
    tool_space: str = "general",
    include_subagents: bool = True,
    limit: int = 25,
) -> Callable[..., Awaitable[RetrieveToolsResult]]:
    """Get a retrieve_tools function configured for specific context.

    This unified function handles both tool discovery (semantic search) and tool binding.
    - When `query` is provided: Returns tool names for discovery (not bound)
    - When `exact_tool_names` is provided: Binds and returns validated tool names

    Args:
        tool_space: Namespace to search for tools
        include_subagents: Whether to include subagent results in search
        limit: Maximum number of tool results for semantic search

    Returns:
        Configured retrieve_tools coroutine that returns RetrieveToolsResult
    """

    async def retrieve_tools(
        store: Annotated[BaseStore, InjectedStore],
        query: Optional[str] = None,
        exact_tool_names: Optional[list[str]] = None,
    ) -> RetrieveToolsResult:
        """Discover available tools or load specific tools by exact name.

        This is your primary tool for working with the tool ecosystem. It has two modes:

        **DISCOVERY MODE** (use `query` parameter):
        Search for tools using natural language. Returns matching tool names without loading them.
        Use this to explore what tools are available before deciding which to load.

        **BINDING MODE** (use `exact_tool_names` parameter):
        Load specific tools by their exact names. The tools become available for use.
        Use this after discovering tool names or when you know exact names from the system prompt.

        WORKFLOW:
        1. Call retrieve_tools(query="your intent") to discover available tools
        2. Review the returned tool names
        3. Call retrieve_tools(exact_tool_names=["tool1", "tool2"]) to load specific tools
        4. Use the loaded tools to complete the task

        TOOL NAME FORMATS:
        - Regular tools: Exact names like "web_search_tool", "create_todo", "GMAIL_SEND_DRAFT"
        - Subagent tools: Prefixed with "subagent:" like "subagent:gmail", "subagent:notion"
          Note: Subagents require using the `handoff` tool to delegate tasks

        Args:
            query: Natural language description for tool discovery.
                   Examples: "email operations", "calendar management", "social media posting"
                   When provided, returns semantically matching tool names (not loaded).

            exact_tool_names: List of exact tool names to load and make available.
                             Examples: ["GMAIL_SEND_DRAFT", "GMAIL_CREATE_EMAIL_DRAFT"]
                             When provided, validates and loads these specific tools.

        Returns:
            Dict with 'tools_to_bind' (tools to load) and 'response' (names to show).
            In discovery mode: tools_to_bind=[], response=[discovered names]
            In binding mode: tools_to_bind=[validated tools], response=[validated tools]

        Examples:
            # Discovery: Find email-related tools (tools NOT loaded, just listed)
            result = await retrieve_tools(query="send email")
            # result['response'] = ["GMAIL_SEND_DRAFT", "subagent:gmail", ...]
            # result['tools_to_bind'] = []  # Nothing bound yet

            # Binding: Load specific tools (tools ARE loaded)
            result = await retrieve_tools(exact_tool_names=["GMAIL_SEND_DRAFT"])
            # result['tools_to_bind'] = ["GMAIL_SEND_DRAFT"]  # Now bound
            # result['response'] = ["GMAIL_SEND_DRAFT"]  # Confirmation
        """
        from app.agents.tools.core.registry import get_tool_registry

        if not query and not exact_tool_names:
            raise ValueError(
                "Either 'query' (for discovery) or 'exact_tool_names' (for binding) is required."
            )

        tool_registry = await get_tool_registry()
        available_tool_names = tool_registry.get_tool_names()

        # BINDING MODE: Validate and bind exact tool names
        if exact_tool_names:
            validated_tool_names = [
                tool_name
                for tool_name in exact_tool_names
                if tool_name in available_tool_names
            ]
            return RetrieveToolsResult(
                tools_to_bind=validated_tool_names,
                response=validated_tool_names,
            )

        # DISCOVERY MODE: Semantic search for tools
        if include_subagents:
            tool_results, subagent_results = await asyncio.gather(
                store.asearch((tool_space,), query=query, limit=limit),
                store.asearch(("subagents",), query=query, limit=10),
            )
        else:
            tool_results = await store.asearch((tool_space,), query=query, limit=limit)
            subagent_results = []

        all_results = []

        for result in tool_results:
            if result.key in available_tool_names:
                all_results.append({"id": result.key, "score": result.score})

        for result in subagent_results:
            all_results.append({"id": result.key, "score": result.score})

        all_results.sort(key=lambda x: x["score"], reverse=True)

        discovered_tools = [r["id"] for r in all_results]
        return RetrieveToolsResult(
            tools_to_bind=[],
            response=discovered_tools,
        )

    return retrieve_tools
