import logging
import time
import httpx
from fastapi import Cookie, HTTPException
from app.db.collections import users_collection
from app.db.db_redis import set_cache, get_cache
from typing import Optional
from app.utils.auth_utils import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_TOKEN_URL,
    GOOGLE_USERINFO_URL,
)

logger = logging.getLogger(__name__)

http_async_client = httpx.AsyncClient()


# Thresholds & cache expiry (in seconds)
TOKEN_REFRESH_THRESHOLD = 300  # 5 minutes
USER_CACHE_EXPIRY = 3600  # 1 hour
TOKEN_CACHE_EXPIRY = 3600  # 1 hour


async def get_user_info(access_token: str) -> dict:
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
    try:
        logger.info(f"Refreshing token using refresh_token: {refresh_token}")
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


async def get_valid_access_token(access_token: str, refresh_token: str) -> (str, int):
    """
    Refreshes the access token using the refresh token.
    Returns a tuple of the new access token and its expires_in value.
    """
    try:
        logger.info("Refreshing access token")
        token_data = await refresh_access_token(refresh_token)
        new_access_token = token_data["access_token"]
        expires_in = token_data.get("expires_in", 3600)
        return new_access_token, expires_in
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        raise HTTPException(status_code=401, detail="Invalid refresh token")


async def get_current_user(
    access_token: Optional[str] = Cookie(None),
    refresh_token: Optional[str] = Cookie(None),
):
    """
    Retrieves the current user by validating or refreshing the access token.
    Uses caching to improve performance.
    """
    if not access_token and not refresh_token:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        user_email = None
        if access_token:
            try:
                user_info = await get_user_info(access_token)
                user_email = user_info.get("email")
            except HTTPException:
                logger.info("Access token invalid or expired")

        # If the access token is invalid/expired, refresh it
        if not user_email:
            if not refresh_token:
                raise HTTPException(status_code=401, detail="Authentication required")
            logger.info("Using refresh token to fetch new access token")
            new_access_token, expires_in = await get_valid_access_token(
                access_token, refresh_token
            )
            access_token = new_access_token
            user_info = await get_user_info(access_token)
            user_email = user_info.get("email")
            # Update token cache using the retrieved email
            cache_key = f"user_token:{user_email}"
            expires_at = int(time.time()) + expires_in
            await set_cache(
                cache_key,
                {"access_token": access_token, "expires_at": expires_at},
                TOKEN_CACHE_EXPIRY,
            )

        if not user_email:
            raise HTTPException(status_code=400, detail="Email not found")

        # Check and update user cache
        cache_key = f"user_cache:{user_email}"
        cached_user_data = await get_cache(cache_key)
        if cached_user_data:
            logger.info(f"Cache hit for user: {user_email}")
            return cached_user_data

        user_data = await users_collection.find_one({"email": user_email})
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")

        user_info_to_cache = {
            "user_id": str(user_data.get("_id")),
            "email": user_email,
            "access_token": access_token,
            "refresh_token": refresh_token,
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
