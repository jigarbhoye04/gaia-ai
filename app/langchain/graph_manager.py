"""
Graph manager module to handle LangGraph initialization and hold the graph instance.

This module helps avoid circular imports between app.api.v1 and app.langchain.agent.
"""

import asyncio
from typing import Any

from app.config.loggers import app_logger as logger


class GraphManager:
    _instance = None
    _graph = None
    _initialization_lock = asyncio.Lock()
    _initialization_complete = asyncio.Event()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = GraphManager()
        return cls._instance

    @classmethod
    def set_graph(cls, graph_instance: Any):
        if cls._graph is not None:
            logger.info("LANGGRAPH: Graph already set, skipping")
            return

        cls._graph = graph_instance
        cls._initialization_complete.set()
        logger.info("LANGGRAPH: Graph instance has been set successfully")

    @classmethod
    async def get_graph(cls) -> Any:
        """Get the graph instance, waiting for it to be initialized if necessary."""
        if cls._graph is None:
            logger.info("LANGGRAPH: Waiting for graph to be initialized...")
            await cls._initialization_complete.wait()
            logger.info("LANGGRAPH: Graph initialization complete, proceeding")
        return cls._graph
