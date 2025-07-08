import io
import json

import cloudinary
import cloudinary.uploader
import httpx
from fastapi import HTTPException

from app.api.v1.dependencies.oauth_dependencies import get_valid_access_token
from app.config.loggers import auth_logger as logger
from app.config.settings import settings
from app.db.redis import get_cache
from app.services.user_service import get_user_by_id

http_async_client = httpx.AsyncClient()


async def upload_user_picture(image_bytes: bytes, public_id: str) -> str:
    """
    Uploads image bytes to Cloudinary and returns the secure URL.

    Args:
        image_bytes (bytes): The raw image data.
        public_id (str): The public ID to assign to the uploaded image.

    Returns:
        str: The secure URL of the uploaded image.

    Raises:
        HTTPException: If the upload to Cloudinary fails.
    """
    try:
        upload_result = cloudinary.uploader.upload(
            io.BytesIO(image_bytes),
            resource_type="image",
            public_id=public_id,
            overwrite=True,
        )
        image_url = upload_result.get("secure_url")
        if not image_url:
            logger.error("Missing secure_url in Cloudinary upload response")
            raise HTTPException(
                status_code=500, detail="Invalid response from image service"
            )

        logger.info(f"Image uploaded successfully. URL: {image_url}")
        return image_url
    except Exception as e:
        logger.error(f"Failed to upload image to Cloudinary: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Image upload failed")


async def fetch_user_info_from_google(access_token: str):
    try:
        response = await http_async_client.get(
            settings.GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

        response.raise_for_status()
        return response.json()
    except httpx.RequestError as e:
        logger.error(f"Error fetching user info: {e}")
        raise HTTPException(status_code=500, detail="Error contacting Google API")


async def get_tokens_from_code(code: str):
    try:
        response = await http_async_client.post(
            settings.GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_CALLBACK_URL,
                "grant_type": "authorization_code",
            },
        )
        response.raise_for_status()
        return response.json()
    except httpx.RequestError as e:
        logger.error(f"Error fetching tokens: {e}")
        raise HTTPException(status_code=500, detail="Error contacting Google API")


async def get_tokens_by_user_id(user_id: str) -> tuple[str, str, bool]:
    """
    Get valid access and refresh tokens for the user by user ID.

    Args:
        user_id: The user's ID

    Returns:
        tuple: (access_token, refresh_token, success_flag)
    """

    # Get user to find email for token operations
    user = await get_user_by_id(user_id)
    if not user:
        logger.error(f"User not found for ID: {user_id}")
        return "", "", False

    email = user.get("email")
    if not email:
        logger.error(f"No email found for user_id: {user_id}")
        return "", "", False

    # Get refresh token from cache (still using email as cache key for now)
    cache_key = f"user_refresh:{email}"
    cached_data = await get_cache(cache_key)

    if not cached_data:
        logger.error(f"Refresh token not found in cache for user: {user_id}")
        return "", "", False

    # Parse the cached token based on its type
    if isinstance(cached_data, str):
        try:
            parsed_data = json.loads(cached_data)
            refresh_token = parsed_data.get("refresh_token")
        except json.JSONDecodeError:
            refresh_token = None
    elif isinstance(cached_data, dict):
        refresh_token = cached_data.get("refresh_token")
    else:
        refresh_token = None

    if not refresh_token:
        logger.error(f"Invalid or missing refresh token for user: {user_id}")
        return "", "", False

    # Get access token using the refresh token
    access_token, _ = await get_valid_access_token(
        user_email=email,
        refresh_token=refresh_token,
    )

    if not access_token:
        logger.error(f"Failed to get access token for user: {user_id}")
        return "", refresh_token, False

    return access_token, refresh_token, True
