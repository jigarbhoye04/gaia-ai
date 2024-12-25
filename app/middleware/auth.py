import logging
import httpx
from fastapi import Cookie, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.db.connect import users_collection
from app.db.redis import redis_cache
from app.utils.auth import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_TOKEN_URL,
    GOOGLE_USERINFO_URL,
)

logger = logging.getLogger(__name__)

# Reusable HTTP client
http_async_client = httpx.AsyncClient()

# OAuth2 Scheme (For Dependency Injection)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")


async def refresh_access_token(refresh_token: str) -> str:
    """
    Refreshes the Google OAuth2.0 access token using the refresh token.
    """
    try:
        response = await http_async_client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        response.raise_for_status()
        new_token_data = response.json()
        return new_token_data.get("access_token")
    except httpx.RequestError as e:
        logger.error(f"HTTP error during token refresh: {e}")
        raise HTTPException(
            status_code=500, detail="Error contacting Google API for token refresh"
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"Token refresh failed: {e.response.text}")
        raise HTTPException(status_code=401, detail="Failed to refresh access token")


async def get_user_info(access_token: str) -> dict:
    """
    Retrieves user information from Google using the access token.
    """
    try:
        response = await http_async_client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return response.json()
    except httpx.RequestError as e:
        logger.error(f"HTTP error during user info retrieval: {e}")
        raise HTTPException(status_code=500, detail="Error contacting Google API")
    except httpx.HTTPStatusError as e:
        logger.warning(f"Token verification failed: {e.response.text}")
        raise HTTPException(status_code=401, detail="Invalid or expired access token")


async def get_current_user(
    access_token: str = Cookie(None), refresh_token: str = Cookie(None)
):
    """
    Dependency to validate the user's authentication status and handle token refreshing.
    Uses Redis to cache user data for subsequent requests.
    """
    if not access_token:
        if not refresh_token:
            raise HTTPException(status_code=401, detail="Authentication required")
        # Refresh access token if expired
        access_token = await refresh_access_token(refresh_token)

    try:
        # Step 1: Verify the access token with Google's API
        user_info = await get_user_info(access_token)
        user_email = user_info.get("email")

        if not user_email:
            logger.error(f"Email not found in Google response: {user_info}")
            raise HTTPException(status_code=400, detail="Email not found in user info")

            # Check if user info is already cached in Redis
        cached_user_data = await redis_cache.get(f"user_cache:{user_email}")
        if cached_user_data:
            return cached_user_data

        # Step 2: Retrieve the user from the database
        user_data = await users_collection.find_one({"email": user_email})

        if not user_data:
            logger.warning(f"User with email {user_email} not found in the database")
            raise HTTPException(status_code=404, detail="User not found")

        # Prepare user data for return and caching
        user_info_to_cache = {
            "user_id": str(user_data.get("_id")),
            "email": user_email,
            "access_token": access_token,
        }

        # Cache the user information in Redis
        await redis_cache.set(f"user_cache:{user_email}", user_info_to_cache)

        return user_info_to_cache

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
