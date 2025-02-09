import logging
import time
import httpx
from fastapi import Cookie, HTTPException
from app.db.collections import users_collection
from app.db.redis import set_cache, get_cache
from typing import Optional
from app.utils.auth_utils import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_TOKEN_URL,
    GOOGLE_USERINFO_URL,
)

logger = logging.getLogger(__name__)

http_async_client = httpx.AsyncClient()

# Constants
TOKEN_REFRESH_THRESHOLD = 300  # 5 minutes in seconds
USER_CACHE_EXPIRY = 3600  # 1 hour for user data
TOKEN_CACHE_EXPIRY = 3600  # Cache for access tokens


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


async def refresh_access_token(refresh_token: str) -> dict:
    """
    Refreshes the Google OAuth2.0 access token with comprehensive error handling.
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
        token_data = response.json()
        return {
            "access_token": token_data.get("access_token"),
            "expires_in": token_data.get("expires_in", 3600),
        }
    except httpx.RequestError as e:
        logger.error(f"Token refresh request error: {e}")
        raise HTTPException(status_code=500, detail="Token refresh failed")
    except httpx.HTTPStatusError as e:
        logger.error(f"Token refresh HTTP error: {e.response.text}")
        raise HTTPException(status_code=401, detail="Invalid refresh token")


async def get_valid_access_token(
    email: str, access_token: str, refresh_token: str
) -> str:
    """
    Ensures the access token is valid and refreshes it if necessary.
    """
    cache_key = f"user_token:{email}"
    cached_token = await get_cache(cache_key)

    if cached_token:
        # Validate token expiration
        expires_at = cached_token.get("expires_at", 0)
        if expires_at > time.time() + TOKEN_REFRESH_THRESHOLD:
            return cached_token["access_token"]

    # If no valid token in cache, refresh
    logger.info(f"Refreshing access token for {email}")
    refresh_response = await refresh_access_token(refresh_token)
    new_access_token = refresh_response["access_token"]
    expires_in = refresh_response["expires_in"]
    expires_at = int(time.time()) + expires_in

    # Update cache with new token
    await set_cache(
        cache_key,
        {"access_token": new_access_token, "expires_at": expires_at},
        TOKEN_CACHE_EXPIRY,
    )
    return new_access_token


async def get_current_user(
    access_token: Optional[str] = Cookie(None),
    refresh_token: Optional[str] = Cookie(None),
):
    """
    Enhanced user authentication with intelligent token management and caching.
    """
    if not access_token and not refresh_token:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        # Validate token and refresh if needed
        user_email = None
        if access_token:
            try:
                user_info = await get_user_info(access_token)
                user_email = user_info.get("email")
            except HTTPException:
                logger.info("Access token invalid or expired")

        # If no valid token, attempt refresh
        if not user_email:
            if not refresh_token:
                raise HTTPException(status_code=401, detail="Authentication required")
            logger.info("Using refresh token to fetch new access token")
            access_token = await get_valid_access_token("", access_token, refresh_token)
            user_info = await get_user_info(access_token)
            user_email = user_info.get("email")

        if not user_email:
            raise HTTPException(status_code=400, detail="Email not found")

        # Unified caching strategy
        cache_key = f"user_cache:{user_email}"
        cached_user_data = await get_cache(cache_key)
        if cached_user_data:
            logger.info(f"Cache hit for user: {user_email}")
            return cached_user_data

        # Database lookup
        user_data = await users_collection.find_one({"email": user_email})
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")

        # Cache user data
        user_info_to_cache = {
            "user_id": str(user_data.get("_id")),
            "email": user_email,
            "access_token": access_token,
            "cached_at": int(time.time()),
        }
        await set_cache(cache_key, user_info_to_cache, USER_CACHE_EXPIRY)
        logger.info(f"User data cached for {user_email}")

        return user_info_to_cache

    except HTTPException as http_err:
        logger.warning(f"Authentication error: {http_err.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected authentication error: {e}")
        raise HTTPException(status_code=500, detail="Authentication processing failed")
