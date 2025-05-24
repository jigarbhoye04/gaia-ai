from langgraph.prebuilt import InjectedStore
from langgraph.store.base import BaseStore
from typing_extensions import Annotated

from app.langchain.client import ALWAYS_AVAILABLE_TOOLS


def retrieve_tools(
    query: str,
    store: Annotated[BaseStore, InjectedStore],
) -> list[str]:
    """Retrieve a tool to use, given a search query."""
    # Search for matching tools based on query
    results = store.search(("tools",), query=query, limit=3)
    tool_ids = [result.key for result in results]

    # Get the always available tools
    always_available_tool_ids = [tool.name for tool in ALWAYS_AVAILABLE_TOOLS]

    # Combine both sets of tools (semantic search + always available)
    combined_tools = tool_ids + always_available_tool_ids

    return combined_tools
