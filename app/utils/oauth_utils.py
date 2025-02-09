"""
Utility module for handling OAuth-related operations.
"""

import httpx
from fastapi import HTTPException
from app.db.collections import users_collection
from app.utils.logging import get_logger
from app.utils.auth_utils import (
    GOOGLE_USERINFO_URL,
    GOOGLE_TOKEN_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
)

logger = get_logger(name="oauth_utils", log_file="auth.log")
http_async_client = httpx.AsyncClient()


async def fetch_user_info_from_google(access_token: str) -> dict:
    """
    Fetch user information from Google using the provided access token.

    Args:
        access_token (str): The OAuth access token.

    Returns:
        dict: The user information as returned by Google.

    Raises:
        HTTPException: If an error occurs while contacting the Google API.
    """
    try:
        response = await http_async_client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return response.json()
    except httpx.RequestError as e:
        logger.error(f"Error fetching user info: {e}")
        raise HTTPException(status_code=500, detail="Error contacting Google API")


async def get_tokens_from_code(code: str) -> dict:
    """
    Exchange an OAuth authorization code for access and refresh tokens.

    Args:
        code (str): The OAuth authorization code.

    Returns:
        dict: A dictionary containing the tokens.

    Raises:
        HTTPException: If an error occurs while contacting the Google API.
    """
    try:
        response = await http_async_client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": "postmessage",
                "grant_type": "authorization_code",
            },
        )
        response.raise_for_status()
        return response.json()
    except httpx.RequestError as e:
        logger.error(f"Error fetching tokens: {e}")
        raise HTTPException(status_code=500, detail="Error contacting Google API")


async def get_user_from_db(user_email: str) -> dict:
    """
    Retrieve a user document from the database by email.

    Args:
        user_email (str): The user's email address.

    Returns:
        dict: The user document if found; otherwise, None.

    Raises:
        HTTPException: If an error occurs while accessing the database.
    """
    try:
        return await users_collection.find_one({"email": user_email})
    except Exception as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Error accessing the database")


async def fetch_or_refresh_user_info(access_token: str, user_email: str) -> dict:
    """
    Retrieve user information from the database if available; otherwise, fetch it from Google.

    Args:
        access_token (str): The OAuth access token.
        user_email (str): The user's email address.

    Returns:
        dict: The user information.
    """
    user_data = await get_user_from_db(user_email)
    if user_data:
        return user_data
    return await fetch_user_info_from_google(access_token)
