import time
from datetime import datetime
from datetime import timezone as tz
from typing import Optional
from zoneinfo import ZoneInfo

import httpx
from app.config.loggers import auth_logger as logger
from app.config.settings import settings
from app.db.mongodb.collections import users_collection
from app.db.redis import set_cache
from fastapi import Cookie, Header, HTTPException

http_async_client = httpx.AsyncClient()


# Thresholds & cache expiry (in seconds)
TOKEN_REFRESH_THRESHOLD = 300  # 5 minutes
USER_CACHE_EXPIRY = 3600  # 1 hour
TOKEN_CACHE_EXPIRY = 3600  # 1 hour
REFRESH_TOKEN_CACHE_EXPIRY = 86400  # 24 hours (refresh tokens typically last longer)


async def get_user_info(access_token: str) -> dict:
    try:
        response = await http_async_client.get(
            settings.GOOGLE_USERINFO_URL,
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
    # Validate required fields
    if not all(
        [
            settings.GOOGLE_CLIENT_ID,
            settings.GOOGLE_CLIENT_SECRET,
            settings.GOOGLE_TOKEN_URL,
        ]
    ):
        logger.error("Missing required credentials for token refresh")
        raise HTTPException(
            status_code=500,
            detail="Missing required credentials for token refresh. Ensure client_id, client_secret, and token_uri are set.",
        )

    try:
        response = await http_async_client.post(
            settings.GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
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


async def get_current_user(access_token: Optional[str] = Cookie(None)):
    """
    Retrieves the current user by validating the access token.
    Uses the token repository for token management and refresh.
    No longer depends on refresh_token from cookies.

    Args:
        access_token: JWT access token from cookie

    Returns:
        User data dictionary with tokens

    Raises:
        HTTPException: On authentication failure
    """
    if not access_token:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        from app.config.token_repository import token_repository

        user_email = None
        user_info = None

        # Try with the provided access token
        try:
            user_info = await get_user_info(access_token)
            user_email = user_info.get("email")

            # If we have a valid access token and user email, find the user in MongoDB
            if user_email:
                user_data = await users_collection.find_one({"email": user_email})

                if not user_data:
                    raise HTTPException(status_code=404, detail="User not found")

                user_id = str(user_data.get("_id"))

                # Store/update the token in repository if it doesn't exist
                existing_token = await token_repository.get_token(user_id, "google")
                if not existing_token:
                    # Store token in repository (without refresh token)
                    await token_repository.store_token(
                        user_id=user_id,
                        provider="google",
                        token_data={
                            "access_token": access_token,
                            "token_type": "Bearer",
                            "expires_at": int(time.time()) + 3600,  # Default expiry
                        },
                    )

        except HTTPException:
            logger.info("Access token invalid or expired")

        # If access token validation failed or we couldn't get user email
        if not user_email:
            # We have no valid access token, so deny access
            # The client should redirect to login flow
            raise HTTPException(
                status_code=401, detail="Authentication required, please login again"
            )

        # At this point we should have valid user_email and access_token
        user_data = await users_collection.find_one({"email": user_email})
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")

        # Update user's last activity
        await users_collection.update_one(
            {"email": user_email},
            {"$set": {"last_active_at": datetime.now(tz.utc)}},
        )

        # Prepare user info for return
        user_info = {
            "user_id": str(user_data.get("_id")),
            "email": user_email,
            "name": user_data.get("name"),
            "picture": user_data.get("picture"),
            "access_token": access_token,
        }

        # Cache user data in Redis for performance
        cache_key = f"user_cache:{user_email}"
        user_info["cached_at"] = int(time.time())
        await set_cache(cache_key, user_info, USER_CACHE_EXPIRY)

        return user_info

    except HTTPException as http_err:
        logger.warning(f"Authentication error: {http_err.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected authentication error: {e}")
        raise HTTPException(status_code=500, detail="Authentication processing failed")


def get_user_timezone(
    x_timezone: str = Header(
        default="UTC", alias="x-timezone", description="User's timezone identifier"
    ),
) -> datetime:
    """
    Get the current time in the user's timezone.
    Uses the x-timezone header to determine the user's timezone.

    Args:
        x_timezone (str): The timezone identifier from the request header.
    Returns:
        datetime: The current time in the user's timezone.
    """
    user_tz = ZoneInfo(x_timezone)
    now = datetime.now(user_tz)

    logger.debug(f"User timezone: {user_tz}, Current time: {now}")
    return now
