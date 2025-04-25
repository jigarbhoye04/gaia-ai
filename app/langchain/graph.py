from app.langchain.graph_builder import build_graph
from app.config.loggers import llm_logger as logger


class GraphManager:
    """
    Singleton class to manage the LangGraph instance.
    """

    _instance = None
    _graph = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GraphManager, cls).__new__(cls)
        return cls._instance

    @classmethod
    def get_instance(cls):
        """Get the singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @property
    def graph(self):
        """Get the graph instance"""
        return self._graph

    async def initialize(self):
        """Initialize the graph if not already initialized"""
        if self._graph is None:
            logger.info("LANGCHAIN: Initializing LangGraph...")
            self._graph = await build_graph()
            if self._graph:
                logger.info(f"Compiled Graph: {self._graph.get_graph().draw_mermaid()}")
            logger.info("LANGCHAIN: LangGraph initialized successfully")
        return self._graph

    async def get_graph(self):
        """Get the graph, initializing if necessary"""
        if self._graph is None:
            return await self.initialize()
        return self._graph

    def reset(self):
        """Reset the graph instance (for testing purposes)"""
        self._graph = None


async def initialize_graph():
    logger.info("LANGCHAIN: Initializing LangGraph...")
    graph_manager = GraphManager.get_instance()
    graph = await graph_manager.initialize()
    logger.info("LANGCHAIN: LangGraph initialized successfully")
    return graph
