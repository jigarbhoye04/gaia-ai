import cloudinary
from fastapi import HTTPException

from app.config.loggers import cloudinary_logger as logger
from app.config.settings import settings

cloud_name = settings.CLOUDINARY_CLOUD_NAME
api_key = settings.CLOUDINARY_API_KEY
api_secret = settings.CLOUDINARY_API_SECRET

if not all([cloud_name, api_key, api_secret]):
    logger.error("Missing required Cloudinary configuration values.")
    raise HTTPException(
        status_code=500,
        detail="Missing Cloudinary configuration values. Ensure that CLOUDINARY_CLOUD_NAME, "
        "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.",
    )


def init_cloudinary():
    """
    Initialize and configure the Cloudinary service.

    This function sets up the Cloudinary configuration using the provided
    environment variables for cloud name, API key, and API secret. If any
    of these values are missing, it logs an error and raises an HTTPException.

        dict: A dictionary containing the Cloudinary configuration values:
            - cloud_name (str): The Cloudinary cloud name.
            - api_key (str): The Cloudinary API key.
            - api_secret (str): The Cloudinary API secret.

    Returns:
        dict: Cloudinary configuration.
    """

    if not all([cloud_name, api_key, api_secret]):
        logger.error("Missing required Cloudinary configuration values.")
        raise HTTPException(
            status_code=500,
            detail="Missing required Cloudinary configuration values. Ensure that CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.",
        )

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
    )

    return {
        "cloud_name": cloud_name,
        "api_key": api_key,
        "api_secret": api_secret,
    }
