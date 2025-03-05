from app.config import settings
import chromadb


class ChromaDBClient:
    """Singleton Async ChromaDB Client."""

    def __init__(self):
        self._client = None

    async def get_client(self):
        """Returns a cached async ChromaDB client."""
        if self._client is None:
            self._client = await chromadb.AsyncHttpClient(
                host=settings.CHROMADB_HOST, port=settings.CHROMADB_PORT
            )
        return self._client


# Create a global ChromaDB instance
chroma_db = ChromaDBClient()
