from typing import Optional
from langgraph.prebuilt.chat_agent_executor import AgentState


class State(AgentState):
    """State model for the LangChain graph."""

    # messages: List[Any]
    # force_web_search: bool
    # force_deep_search: bool
    # should_fetch_webpage: bool
    current_datetime: Optional[str]
    # page_fetch_urls: List[str]
