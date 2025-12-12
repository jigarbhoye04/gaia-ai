"""
Sub-agent framework for specialized provider agents.

This module provides a reusable architecture for creating provider-specific sub-agents
that can handle specialized tool sets (Gmail, Notion, Twitter, LinkedIn, etc.)
"""

from .base_subagent import SubAgentFactory
from .handoff_tools import handoff, index_subagents_to_store, tools

__all__ = ["SubAgentFactory", "handoff", "tools", "index_subagents_to_store"]
