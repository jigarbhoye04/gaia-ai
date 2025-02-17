import logging
import time
from typing import Optional

from fastapi import Cookie, HTTPException
from jose import JWTError, jwt
from pymongo.collection import Collection

from app.db.collections import users_collection
from app.db.db_redis import get_cache, set_cache
from app.services.oauth_service import (
    ACCESS_TOKEN_SECRET_KEY,
    ALGORITHM,
    create_access_token,
    verify_refresh_token,
)

logger = logging.getLogger("oauth_dependencies")

USER_CACHE_EXPIRY = 3600  # seconds


def get_users_collection() -> Collection:
    """
    Dependency that returns the MongoDB users collection.

    Returns:
        Collection: The MongoDB collection for users.
    """
    return users_collection


async def get_current_user(
    access_token: Optional[str] = Cookie(None),
    refresh_token: Optional[str] = Cookie(None),
) -> dict:
    """
    Dependency to retrieve and validate the current user using JWT tokens from cookies.
    Supports automatic access token refresh using the refresh token.

    Returns:
        dict: A dictionary containing user details in the format:
            {
                "user_id": str(user_data.get("_id")),
                "email": user_email,
                "access_token": access_token,
                "cached_at": int(time.time()),
            }

    Raises:
        HTTPException: If authentication fails or the user is not found.
    """
    if not access_token and not refresh_token:
        raise HTTPException(status_code=401, detail="Authentication required")

    user_email = None
    token_payload = None

    # Attempt to decode the access token.
    if access_token:
        try:
            token_payload = jwt.decode(
                access_token, ACCESS_TOKEN_SECRET_KEY, algorithms=[ALGORITHM]
            )
            if token_payload.get("type") != "access":
                raise HTTPException(status_code=401, detail="Invalid token type")
            user_email = token_payload.get("email")
        except JWTError:
            logger.info("Access token invalid or expired")

    # If the access token is invalid, try using the refresh token.
    if not user_email and refresh_token:
        try:
            refresh_payload = verify_refresh_token(refresh_token)
            user_email = refresh_payload.get("email")
            # Generate a new access token with minimal payload.
            new_payload = {"email": user_email, "sub": refresh_payload.get("sub")}
            access_token = create_access_token(new_payload)
            token_payload = jwt.decode(
                access_token, ACCESS_TOKEN_SECRET_KEY, algorithms=[ALGORITHM]
            )
        except Exception as e:
            logger.error(f"Refresh token error: {e}")
            raise HTTPException(status_code=401, detail="Invalid or expired tokens")

    if not user_email:
        raise HTTPException(status_code=400, detail="Email not found in token")

    cache_key = f"user_cache:{user_email}"
    cached_user_data = await get_cache(cache_key)
    if cached_user_data:
        logger.info(f"Cache hit for user: {user_email}")
        return cached_user_data

    # Retrieve the user from the database.
    user_data = await users_collection.find_one({"email": user_email})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    user_info = {
        "user_id": str(user_data.get("_id")),
        "email": user_email,
        "name": user_data.get("name") or token_payload.get("name"),
        "picture": user_data.get("picture") or token_payload.get("picture"),
        "access_token": access_token,
        "cached_at": int(time.time()),
    }

    await set_cache(cache_key, user_info, USER_CACHE_EXPIRY)
    logger.info(f"User data cached for {user_email}")
    return user_info
