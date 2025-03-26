from datetime import datetime, timezone

import requests
from fastapi import HTTPException

from app.config.loggers import app_logger as logger
from app.db.collections import users_collection
from app.utils.oauth_utils import upload_user_picture


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
