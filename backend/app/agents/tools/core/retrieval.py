import asyncio
from typing import Annotated, Awaitable, Callable

from langchain_core.tools import BaseTool, tool
from langgraph.prebuilt import InjectedStore
from langgraph.store.base import BaseStore

TOOLS_LIMIT = 25


@tool
async def list_tools(
    query: str,
    store: Annotated[BaseStore, InjectedStore],
) -> list[str]:
    """List available tool and subagent names matching your query. Returns names only (not loaded).

    Use this to DISCOVER what tools exist before loading them. This is lightweight and can
    return many results (20-30+) since it only returns names, not full tool definitions.

    WORKFLOW:
    1. Call list_tools(query="your intent") to see available options
    2. Pick the exact tool names you need from the results
    3. Call retrieve_tools(exact_tool_names=[...]) to load those specific tools

    This two-step approach lets you see a broad range of options before committing
    to loading specific tools, avoiding token waste on irrelevant tools.

    Args:
        query: Natural language description of what you want to accomplish.
               Examples: "email operations", "calendar management", "social media posting"

    Returns:
        List of tool/subagent names matching the query. Subagents have "subagent:" prefix.
    """
    from app.agents.tools.core.registry import get_tool_registry

    tool_registry = await get_tool_registry()
    available_tool_names = tool_registry.get_tool_names()

    tool_results, subagent_results = await asyncio.gather(
        store.asearch(("general",), query=query, limit=TOOLS_LIMIT),
        store.asearch(("subagents",), query=query, limit=TOOLS_LIMIT),
    )

    all_results = []

    for result in tool_results:
        if result.key in available_tool_names:
            all_results.append({"id": result.key, "score": result.score})

    for result in subagent_results:
        all_results.append({"id": f"subagent:{result.key}", "score": result.score})

    all_results.sort(key=lambda x: x["score"], reverse=True)

    return [r["id"] for r in all_results[:TOOLS_LIMIT]]


def get_retrieve_tools_function(
    tool_space: str = "general",
    include_core_tools: bool = True,
    additional_tools: list[BaseTool] = [],
    limit: int = 5,
) -> Callable[..., Awaitable[list[str]]]:
    """
    Get a function to retrieve tools based on a search query.

    Args:
        tool_space: Namespace prefix for the tools.
        exclude_tools: List of tool names to exclude from results.
        include_core_tools: Whether to include core tools in the results.

    Returns:
        A function that retrieves tools based on the provided parameters.
    """

    async def retrieve_tools(
        store: Annotated[BaseStore, InjectedStore],
        query: str = "",
        exclude_tools: list[str] = [],
        exact_tool_names: list[str] = [],
    ) -> list[str]:
        """Retrieve tools and subagents to use based on exact tool names or semantic search queries.

        This is your primary tool discovery mechanism. Use this function to find the specific tools
        or subagents you need for any task. You must provide either exact_tool_names OR query (or both).

        RETURNS:
        - Regular tool names: Direct executable tools (e.g., "create_todo", "web_search_tool")
        - Subagent IDs with prefix: "subagent:gmail", "subagent:notion", "subagent:google_calendar"
          These require using the `handoff` tool to delegate tasks.

        EXACT TOOL NAMES (PRIMARY METHOD):
        Use this when you know the exact tool name from the system prompt or previous context.
        This is the most direct and reliable method when you're certain of the tool name.

        SEMANTIC SEARCH (FALLBACK METHOD):
        Use natural language queries to describe what you want to accomplish when you don't know
        the exact tool names. The system uses vector similarity to find the most relevant tools
        and subagents based on your intent.

        Semantic Query Guidelines:
        • Analyze user's intent: "What is the user trying to accomplish?"
        • Use descriptive, action-oriented queries: "send email", "create calendar event", "search contacts"
        • Try category + action format: "gmail send", "notion create", "twitter post", "calendar view"
        • Use synonyms and related terms if first attempt doesn't work
        • Don't hesitate to call this function multiple times for different functionalities
        • Be persistent - if you know a tool should exist, try different query variations

        Suggested query patterns:
        • Email: "mail send", "gmail compose", "email draft", "contact search"
        • Calendar: "calendar create", "schedule event", "calendar view", "meeting search"
        • Todos: "todo create", "task update", "todo delete", "task search"
        • Notion: "notion create page", "notion database", "notion search", "workspace manage"
        • Twitter: "twitter post", "social media", "tweet create", "twitter search"
        • LinkedIn: "linkedin post", "professional network", "career content"
        • Research: "web search", "deep research", "fetch webpage"
        • Documents: "google docs", "document create", "file generate"
        • Code: "execute code", "run script", "code sandbox"
        • Weather: "weather check", "current weather"
        • Images: "generate image", "create visual"
        • Flowcharts: "create flowchart", "diagram generate"

        Args:
            query: Natural language description of what you want to accomplish.
                   Use when you don't know exact tool names. Use descriptive terms and try
                   different phrasings if initial search fails. Can be empty if using exact_tool_names.
            exclude_tools: List of tool names to exclude from results.
            exact_tool_names: List of EXACT tool names to include directly in results.
                             Use when you know the exact tool name from system prompt STRICTLY.
                             Examples:
                             - "GMAIL_SEND_DRAFT", "GMAIL_CREATE_EMAIL_DRAFT"
                             - "NOTION_CREATE_DATABASE", "NOTION_ADD_PAGE_CONTENT"
                             - "TWITTER_CREATION_OF_A_POST", "TWITTER_USER_LOOKUP_ME"

        Returns:
            List of tool names that match the search criteria.

        Usage Examples:
        • retrieve_tools(exact_tool_names=["GMAIL_SEND_DRAFT"]) - Get specific tool when you know the name
        • retrieve_tools(query="send email") - Find email sending tools when you don't know exact names
        • retrieve_tools(exact_tool_names=["NOTION_SPECIFIC_TOOL"], query="notion database") - Combine both

        Workflow Strategy:
        1. Start with exact_tool_names if you know the precise tool names from system prompt
        2. Fallback to semantic queries when you don't know exact names
        3. Try multiple query variations if first semantic attempt doesn't find expected tools
        4. Retrieve ALL necessary tools before starting task execution
        5. Call this function multiple times for different tool categories as needed
        """
        from app.agents.tools.core.registry import get_tool_registry

        # Validate that at least one search method is provided
        if not query and not exact_tool_names:
            raise ValueError(
                "Must provide either 'query' for semantic search or 'exact_tool_names' for direct tool retrieval"
            )

        # Lazy import to avoid circular dependency

        tool_registry = await get_tool_registry()
        tool_ids = set()

        # Get all available tool names for validation
        available_tool_names = tool_registry.get_tool_names()

        # Search for matching tools based on query (if provided)
        if query:
            # Search both tools and subagents with increased limit for better ranking
            combined_limit = limit + 3
            tool_results, subagent_results = await asyncio.gather(
                store.asearch((tool_space,), query=query, limit=combined_limit),
                store.asearch(("subagents",), query=query, limit=combined_limit),
            )

            all_results = []

            for result in tool_results:
                if result.key in available_tool_names:
                    all_results.append({"id": result.key, "score": result.score})

            for result in subagent_results:
                all_results.append(
                    {
                        "id": f"subagent:{result.key}",
                        "score": result.score,
                    }
                )

            all_results.sort(key=lambda x: x["score"], reverse=True)
            top_results = all_results[: limit + 3]

            # Extract IDs from top ranked results
            tool_ids.update([r["id"] for r in top_results])

        if include_core_tools:
            # Filter core tools based on exclusions
            filtered_core_tools = [
                tool
                for tool in tool_registry.get_core_tools()
                if tool.name not in exclude_tools
            ]

            # Core tools are essential tools that should be accessible regardless of semantic search results
            core_tool_ids = [tool.name for tool in filtered_core_tools]

            tool_ids.update(core_tool_ids)

        # Include any additional specified tools (validate they exist)
        if additional_tools:
            additional_tool_ids = [
                tool.name
                for tool in additional_tools
                if tool.name not in exclude_tools and tool.name in available_tool_names
            ]
            tool_ids.update(additional_tool_ids)

        # Add exact tool names if specified (validate they exist in registry)
        if exact_tool_names:
            exact_tool_ids = [
                tool_name
                for tool_name in exact_tool_names
                if tool_name not in exclude_tools
                and tool_name not in tool_ids
                and tool_name in available_tool_names
            ]
            tool_ids.update(exact_tool_ids)

        return list(tool_ids)

    return retrieve_tools
