"""
API dependencies for the GAIA API.
"""

from fastapi import Request
from app.db.chromadb import get_chroma_client


async def get_chromadb(request: Request):
    """
    Dependency that provides access to the ChromaDB client.

    Args:
        request: The FastAPI request object

    Returns:
        The initialized ChromaDB client
    """
    return get_chroma_client(request)


