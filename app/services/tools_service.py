"""
Service for managing and retrieving tool information.
"""

from typing import List, Dict
from langchain_core.tools import BaseTool

from app.langchain.tools.core.registry import tools, ALWAYS_AVAILABLE_TOOLS
from app.models.tools_models import ToolInfo, ToolsListResponse, ToolsCategoryResponse



def _categorize_tool(tool_name: str) -> str:
    """Categorize tools based on their name and functionality."""
    name_lower = tool_name.lower()
    
    # Define category mappings
    category_mappings = {
        'productivity': ['todo', 'reminder', 'note', 'goal'],
        'communication': ['mail', 'email', 'compose'],
        'search': ['search', 'web', 'deep'],
        'calendar': ['calendar', 'event', 'schedule'],
        'documents': ['document', 'google_docs', 'file', 'pdf'],
        'media': ['image', 'generate_image', 'flowchart'],
        'development': ['code', 'execute'],
        'information': ['weather', 'webpage', 'fetch'],
        'memory': ['memory', 'remember', 'recall']
    }
    
    for category, keywords in category_mappings.items():
        if any(keyword in name_lower for keyword in keywords):
            return category
    
    return 'general'


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
        category = _categorize_tool(name)
        categories.add(category)
        
        tool_info = ToolInfo(
            name=name,
            category=category,
        )
        tool_infos.append(tool_info)
    
    return ToolsListResponse(
        tools=tool_infos,
        total_count=len(tool_infos),
        categories=sorted(list(categories))
    )


async def get_tools_by_category(category: str) -> ToolsCategoryResponse:
    """Get tools filtered by category."""
    all_tools_response = await get_available_tools()
    filtered_tools = [
        tool for tool in all_tools_response.tools 
        if tool.category == category.lower()
    ]
    
    return ToolsCategoryResponse(
        category=category,
        tools=filtered_tools,
        count=len(filtered_tools)
    )


async def get_tool_categories() -> Dict[str, int]:
    """Get all tool categories with their counts."""
    all_tools_response = await get_available_tools()
    category_counts = {}
    
    for tool in all_tools_response.tools:
        category = tool.category
        category_counts[category] = category_counts.get(category, 0) + 1
    
    return category_counts