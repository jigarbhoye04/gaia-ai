from datetime import datetime, timezone
import io
import requests
import cloudinary
from fastapi import HTTPException
from app.config.loggers import app_logger as logger
from app.db.collections import users_collection


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


async def store_user_info(name: str, email: str, picture_url: str):
    """
    Stores user info from Google callback with Cloudinary-hosted profile pictures.

    - Downloads and uploads external images to Cloudinary
    - Updates existing users or creates new ones
    - Ensures profile pictures are always stored on Cloudinary

    Args:
        name (str): The user's name.
        email (str): The user's email.
        picture_url (str): The URL of the profile picture from Google.

    Returns:
        The user's MongoDB _id.

    Raises:
        HTTPException: If any step in the process fails.
    """
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    expected_prefix = "https://res.cloudinary.com"
    current_time = datetime.now(timezone.utc)

    if picture_url and not picture_url.startswith(expected_prefix):
        try:
            response = requests.get(picture_url, timeout=10)
            response.raise_for_status()
            image_bytes = response.content

            public_id = f"user_{email.replace('@', '_at_').replace('.', '_dot_')}"

            picture_url = await upload_user_picture(image_bytes, public_id)

        except requests.RequestException as e:
            logger.error(
                f"Error downloading image from URL {picture_url}: {str(e)}",
                exc_info=True,
            )

            picture_url = ""

    existing_user = await users_collection.find_one({"email": email})

    if existing_user:
        update_data = {
            "name": name,
            "updated_at": current_time,
        }

        if picture_url and (
            not existing_user.get("picture")
            or not existing_user["picture"].startswith(expected_prefix)
        ):
            update_data["picture"] = picture_url

        await users_collection.update_one({"email": email}, {"$set": update_data})
        return existing_user["_id"]
    else:
        user_data = {
            "name": name,
            "email": email,
            "picture": picture_url or "",
            "created_at": current_time,
            "updated_at": current_time,
        }

        result = await users_collection.insert_one(user_data)
        return result.inserted_id
