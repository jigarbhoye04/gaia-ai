import io

import cloudinary
import cloudinary.uploader
import httpx
from fastapi import HTTPException

from app.config.loggers import auth_logger as logger
from app.config.settings import settings

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
