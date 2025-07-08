"""
Pydantic models for tool-related operations.
"""

from typing import List, Optional, Any
from pydantic import BaseModel


class ToolInfo(BaseModel):
    """Model for individual tool information."""
    name: str
    category: str


class ToolsListResponse(BaseModel):
    """Response model for tools list endpoint."""
    tools: List[ToolInfo]
    total_count: int
    categories: List[str]


class ToolsCategoryResponse(BaseModel):
    """Response model for tools by category."""
    category: str
    tools: List[ToolInfo]
    count: int