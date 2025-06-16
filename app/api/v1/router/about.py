"""
About page router for the GAIA API.

This module contains routes related to the about page functionality.
"""

from fastapi import APIRouter, HTTPException

from app.models.about_models import AboutResponse
from app.services.about_service import get_about_content

router = APIRouter()


@router.get("/about", response_model=AboutResponse)
async def get_about():
    """
    Get the about page content including markdown content and author information.

    Returns:
        AboutResponse: The about page content with authors and markdown content
    """
    try:
        return await get_about_content()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch about content: {str(e)}"
        )
