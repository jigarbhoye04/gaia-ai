"""
API dependencies for the GAIA API.
"""

from fastapi import Request

from app.db.chromadb import ChromaClient


async def get_chromadb(request: Request):
    """
    Dependency that provides access to the ChromaDB client.

    Args:
        request: The FastAPI request object

    Returns:
        The initialized ChromaDB client
    """
    return ChromaClient.get_client(request)
