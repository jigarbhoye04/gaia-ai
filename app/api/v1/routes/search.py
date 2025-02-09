"""
Router module for search and URL metadata endpoints.
"""

from fastapi import APIRouter, Depends, status
from app.api.v1.dependencies.auth import get_current_user
from app.models.search_models import URLRequest, URLResponse
from app.services.search_service import Search

router = APIRouter()
search_service = Search()


@router.get("/search")
async def search_messages(query: str, user: dict = Depends(get_current_user)):
    """
    Search for messages, conversations, and notes by their description or content.

    Args:
        query (str): The search query.
        user (dict): The authenticated user information.

    Returns:
        dict: A dictionary containing the search results for messages, conversations, and notes.
    """
    user_id = user["user_id"]
    return await search_service.search_messages(query, user_id)


@router.post(
    "/fetch-url-metadata", response_model=URLResponse, status_code=status.HTTP_200_OK
)
async def fetch_url(data: URLRequest):
    """
    Fetch URL metadata including title, description, favicon, and website name.

    Args:
        data (URLRequest): The URL request data containing the URL.

    Returns:
        URLResponse: The fetched URL metadata.
    """
    return await search_service.fetch_url_metadata(data.url)
