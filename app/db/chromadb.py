from functools import lru_cache
from typing import Dict, Optional

import chromadb
from fastapi import Request
from langchain.embeddings.base import Embeddings
from langchain_chroma import Chroma
from langchain_community.embeddings.sentence_transformer import (
    SentenceTransformerEmbeddings,
)

from app.config.loggers import app_logger as logger
from app.config.settings import settings


@lru_cache(maxsize=1)
def get_langchain_embedding_model() -> Embeddings:
    """
    Lazy-load the SentenceTransformer model and cache it.

    Returns:
        SentenceTransformerEmbeddings: The embedding model
    """
    return SentenceTransformerEmbeddings(
        model_name="all-MiniLM-L6-v2",
    )


class ChromaClient:
    __instance = None

    def __new__(cls, *args, **kwargs):
        if cls.__instance is None:
            cls.__instance = super(ChromaClient, cls).__new__(cls)
            cls.__instance._initialized = False
        return cls.__instance

    def __init__(
        self,
        chroma_client: chromadb.AsyncClientAPI,
        langchain_chroma_client: Chroma,
        constructor_client: chromadb.ClientAPI | None = None,
    ):
        # Only initialize once
        if not hasattr(self, "_initialized") or not self._initialized:
            self._chroma_client = chroma_client
            self._default_langchain_client = langchain_chroma_client
            self._constructor_client = constructor_client
            self._langchain_clients: Dict[str, Chroma] = {}
            self._initialized: bool = True

    @staticmethod
    def get_client(request: Request | None = None) -> chromadb.Client:
        """
        Get the ChromaDB client from the application state.

        Args:
            request: The FastAPI request object

        Returns:
            The ChromaDB client from the application state

        Raises:
            RuntimeError: If ChromaDB client is not available in the application state
        """
        if not request:
            if ChromaClient.__instance is None or not hasattr(
                ChromaClient.__instance, "_chroma_client"
            ):
                logger.error("CHROMA: ChromaDB client not initialized")
                raise RuntimeError("CHROMA: ChromaDB client not initialized")
            return ChromaClient.__instance._chroma_client

        if not hasattr(request.app.state, "chroma_client"):
            logger.error("CHROMA: ChromaDB client not found in application state")
            raise RuntimeError(
                "CHROMA: ChromaDB client not initialized in application state"
            )
        return request.app.state.chroma_client

    @staticmethod
    async def get_langchain_client(
        collection_name: Optional[str] = None,
        embedding_function: Optional[Embeddings] = get_langchain_embedding_model(),
        create_if_not_exists: bool = True,
    ) -> Chroma:
        """
        Get a langchain Chroma client for a specific collection.

        Args:
            collection_name: The name of the collection to connect to. If None, returns the default client.
            embedding_function: Optional embedding function to use with the client.

        Returns:
            The langchain Chroma client for the specified collection

        Raises:
            RuntimeError: If langchain Chroma client is not available
        """
        if ChromaClient.__instance is None:
            logger.error("CHROMA: ChromaClient instance not initialized")
            raise RuntimeError("CHROMA: ChromaClient instance not initialized")

        # If no collection name provided, return the default client
        if not collection_name:
            if (
                not hasattr(ChromaClient.__instance, "_default_langchain_client")
                or not ChromaClient.__instance._default_langchain_client
            ):
                logger.error("CHROMA: Default Langchain Chroma client not found")
                raise RuntimeError(
                    "CHROMA: Default Langchain Chroma client not initialized"
                )
            return ChromaClient.__instance._default_langchain_client

        # Check if we already have a client for this collection
        if collection_name in ChromaClient.__instance._langchain_clients:
            return ChromaClient.__instance._langchain_clients[collection_name]

        # Create a new client for this collection
        try:
            chroma_client = ChromaClient.__instance._chroma_client
            constructor_client = ChromaClient.__instance._constructor_client

            # Check if collection exists, create if it doesn't
            collections = await chroma_client.list_collections()

            if collection_name not in collections:
                if create_if_not_exists:
                    logger.info(
                        f"CHROMA: Collection '{collection_name}' not found. Creating new collection..."
                    )
                    await chroma_client.create_collection(
                        name=collection_name, metadata={"hnsw:space": "cosine"}
                    )
                    logger.info(
                        f"CHROMA: Collection '{collection_name}' created successfully."
                    )
                else:
                    logger.error(
                        f"CHROMA: Collection '{collection_name}' not found and create_if_not_exists is False"
                    )
                    raise RuntimeError(
                        f"CHROMA: Collection '{collection_name}' not found"
                    )

            # Create Langchain client for this collection
            new_client = Chroma(
                client=constructor_client,
                collection_name=collection_name,
                embedding_function=embedding_function,
            )

            # Cache the client for future use
            ChromaClient.__instance._langchain_clients[collection_name] = new_client
            logger.info(
                f"CHROMA: Created new Langchain client for collection '{collection_name}'"
            )
            return new_client
        except Exception as e:
            logger.error(
                f"CHROMA: Error creating Langchain client for collection '{collection_name}': {e}"
            )
            raise RuntimeError(f"CHROMA: Failed to create Langchain client: {e}") from e


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

        # Initialize ChromaDB async http client
        client = await chromadb.AsyncHttpClient(
            host=settings.CHROMADB_HOST,
            port=settings.CHROMADB_PORT,
        )

        # Initialize ChromaDB async client for langchain
        # This is a workaround to avoid the `coroutine` error in langchain
        # when using the async client directly
        constructor_client = chromadb.Client(
            settings=chromadb.Settings(
                chroma_server_host=settings.CHROMADB_HOST,
                chroma_server_http_port=settings.CHROMADB_PORT,
            )
        )

        # Create default langchain client with no specific collection
        langchain_chroma_client = Chroma(
            client=constructor_client,
            embedding_function=get_langchain_embedding_model(),
        )

        response = await client.heartbeat()

        existing_collections = await client.list_collections()
        collection_names = ["notes", "documents"]

        # Create collections if they don't exist
        for collection_name in collection_names:
            if collection_name not in existing_collections:
                logger.info(
                    f"CHROMA: '{collection_name}' collection not found. Creating new collection..."
                )
                await client.create_collection(
                    name=collection_name, metadata={"hnsw:space": "cosine"}
                )
                logger.info(
                    f"CHROMA: '{collection_name}' collection created successfully."
                )

        logger.info(f"CHROMA: ChromaDB heartbeat response: {response}")
        logger.info(
            f"CHROMA: Successfully connected to ChromaDB at {settings.CHROMADB_HOST}:{settings.CHROMADB_PORT}"
        )

        ChromaClient(
            chroma_client=client,
            langchain_chroma_client=langchain_chroma_client,
            constructor_client=constructor_client,
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
