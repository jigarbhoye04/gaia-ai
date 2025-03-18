"""
General routes for the GAIA API.

This module contains general-purpose routes for the GAIA API.
"""

from fastapi import APIRouter

router = APIRouter()


async def helper_function():
    """
    Helper function that returns a welcome message.

    Returns:
        dict: A welcome message.
    """
    return {"message": "Welcome to the GAIA API!"}


@router.get("/ping")
async def ping():
    """
    Ping route to check the API status.

    Returns:
        dict: A welcome message.
    """
    return helper_function()
