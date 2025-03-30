import chromadb
from app.config.settings import settings
from app.config.loggers import app_logger as logger
from fastapi import Request


async def init_chroma():
    try:
        logger.info("CHROMA: Initializing ChromaDB connection...")

        chroma_client = await chromadb.AsyncHttpClient(
            host=settings.CHROMADB_HOST, port=settings.CHROMADB_PORT
        )

        response = await chroma_client.heartbeat()
        logger.info(f"CHROMA: ChromaDB heartbeat response: {response}")
        logger.info(
            f"CHROMA: Successfully connected to ChromaDB at {settings.CHROMADB_HOST}:{settings.CHROMADB_PORT}"
        )
        return chroma_client
    except Exception as e:
        logger.error(f"CHROMA: Error connecting to ChromaDB: {e}")
        logger.warning(
            f"CHROMA: Failed to connect to ChromaDB at {settings.CHROMADB_HOST}:{settings.CHROMADB_PORT}"
        )
        raise RuntimeError(f"CHROMA: ChromaDB connection failed: {e}") from e


def get_chroma_client(request: Request):
    """
    Get the ChromaDB client from the application state.

    Args:
        request: The FastAPI request object

    Returns:
        The ChromaDB client from the application state

    Raises:
        RuntimeError: If ChromaDB client is not available in the application state
    """
    if not hasattr(request.app.state, "chroma_client"):
        raise RuntimeError("ChromaDB client not initialized in application state")
    return request.app.state.chroma_client
