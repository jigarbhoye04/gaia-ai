"""
Service for managing and retrieving tool information.
"""

from typing import Dict
from langchain_core.tools import BaseTool

from app.langchain.tools.core.registry import (
    tools,
    ALWAYS_AVAILABLE_TOOLS,
    CATEGORY_INTEGRATION_REQUIREMENTS,
)
from app.langchain.tools.core.categories import get_tool_category
from app.models.tools_models import ToolInfo, ToolsListResponse, ToolsCategoryResponse


async def get_available_tools() -> ToolsListResponse:
    """Get list of all available tools with their metadata."""
    all_tools = tools + ALWAYS_AVAILABLE_TOOLS
    tool_infos = []
    categories = set()

    for tool in all_tools:
        if not isinstance(tool, BaseTool):
            continue

        # Extract basic info
        name = tool.name
        category = get_tool_category(name)
        categories.add(category)

        # Check if this category requires an integration
        required_integration = CATEGORY_INTEGRATION_REQUIREMENTS.get(category)

        tool_info = ToolInfo(
            name=name,
            category=category,
            required_integration=required_integration,
        )
        tool_infos.append(tool_info)

    return ToolsListResponse(
        tools=tool_infos,
        total_count=len(tool_infos),
        categories=sorted(list(categories)),
    )


async def get_tools_by_category(category: str) -> ToolsCategoryResponse:
    """Get tools filtered by category."""
    all_tools_response = await get_available_tools()
    filtered_tools = [
        tool for tool in all_tools_response.tools if tool.category == category.lower()
    ]

    return ToolsCategoryResponse(
        category=category, tools=filtered_tools, count=len(filtered_tools)
    )


async def get_tool_categories() -> Dict[str, int]:
    """Get all tool categories with their counts."""
    all_tools_response = await get_available_tools()
    category_counts: Dict[str, int] = {}

    for tool in all_tools_response.tools:
        category = tool.category
        category_counts[category] = category_counts.get(category, 0) + 1

    return category_counts
