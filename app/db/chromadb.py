import chromadb
from app.config.settings import settings
from app.config.loggers import app_logger as logger
from fastapi import Request


async def init_chroma(app=None):
    """
    Initialize ChromaDB connection and store the client in the app state.

    Args:
        app: FastAPI application instance

    Returns:
        The ChromaDB client
    """
    try:
        logger.info("CHROMA: Initializing ChromaDB connection...")

        client = await chromadb.AsyncHttpClient(
            host=settings.CHROMADB_HOST, port=settings.CHROMADB_PORT
        )

        response = await client.heartbeat()

        existing_collections = await client.list_collections()
        if "notes" not in existing_collections:
            logger.info(
                "CHROMA: 'notes' collection not found. Creating new collection..."
            )
            await client.create_collection(
                name="notes", metadata={"hnsw:space": "cosine"}
            )
            logger.info("CHROMA: 'notes' collection created successfully.")

        # Initialize documents collection
        if "documents" not in existing_collections:
            logger.info(
                "CHROMA: 'documents' collection not found. Creating new collection..."
            )
            await client.create_collection(
                name="documents", metadata={"hnsw:space": "cosine"}
            )
            logger.info("CHROMA: 'documents' collection created successfully.")

        logger.info(f"CHROMA: ChromaDB heartbeat response: {response}")
        logger.info(
            f"CHROMA: Successfully connected to ChromaDB at {settings.CHROMADB_HOST}:{settings.CHROMADB_PORT}"
        )

        if app:
            app.state.chroma_client = client
            logger.info("CHROMA: Client stored in application state")

        return client
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
        logger.error("CHROMA: ChromaDB client not found in application state")
        raise RuntimeError(
            "CHROMA: ChromaDB client not initialized in application state"
        )
    return request.app.state.chroma_client
