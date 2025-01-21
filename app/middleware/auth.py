import logging
import httpx
from fastapi import Cookie, HTTPException
from app.db.connect import users_collection
from app.db.redis import set_cache, get_cache
from typing import Optional

from app.utils.auth import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_TOKEN_URL,
    GOOGLE_USERINFO_URL,
)

logger = logging.getLogger(__name__)

http_async_client = httpx.AsyncClient()


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


# async def get_user_info(access_token: str, etag: Optional[str] = None) -> dict:
#     headers = {"Authorization": f"Bearer {access_token}"}
#     if etag:
#         headers["If-None-Match"] = etag

#     try:
#         response = await http_async_client.get(GOOGLE_USERINFO_URL, headers=headers)

#         # If not modified, return cached data
#         if response.status_code == 304:
#             logger.info("User info not modified, using cached data")
#             return None

#         response.raise_for_status()
#         return {
#             "user_info": response.json(),
#             "etag": response.headers.get("ETag"),
#         }
#     except httpx.RequestError as e:
#         logger.error(f"HTTP error during user info retrieval: {e}")
#         raise HTTPException(status_code=500, detail="Error contacting Google API")
#     except httpx.HTTPStatusError as e:
#         logger.warning(f"Token verification failed: {e.response.text}")
#         raise HTTPException(status_code=401, detail="Invalid or expired access token")


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
    access_token: Optional[str] = Cookie(None),
    refresh_token: Optional[str] = Cookie(None),
):
    """
    Dependency to validate the user's authentication status and handle token refreshing.
    Uses Redis to cache user data for subsequent requests.
    """
    try:
        # Ensure at least one token is provided
        if not access_token and not refresh_token:
            logger.warning("No tokens provided in request")
            raise HTTPException(status_code=401, detail="Authentication required")

        # Refresh the access token if needed
        if not access_token:
            logger.info("Access token missing, attempting refresh")
            access_token = await refresh_access_token(refresh_token)
            if not access_token:
                raise HTTPException(status_code=401, detail="Invalid refresh token")

        # Step 1: Verify the access token with Google's API
        user_info = await get_user_info(access_token)
        user_email = user_info.get("email")
        if not user_email:
            logger.error("Email not found in user info returned by Google")
            raise HTTPException(status_code=400, detail="Email not found in user info")

        # Step 2: Check for cached user data in Redis
        cache_key = f"user_cache:{user_email}"
        cached_user_data = await get_cache(cache_key)
        if cached_user_data:
            logger.info(f"Cache hit for user: {user_email}")
            return cached_user_data

        # Step 3: Retrieve user data from the database
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

        # Step 4: Cache the user information in Redis
        await set_cache(cache_key, user_info_to_cache)
        logger.info(f"User data cached for {user_email}")

        return user_info_to_cache

    except HTTPException as e:
        # Log HTTP exceptions for better traceability
        logger.warning(f"HTTPException: {e.detail}")
        raise
    except Exception as e:
        # Catch unexpected errors
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
