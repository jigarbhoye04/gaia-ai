import cloudinary
from config.settings import settings
from fastapi import HTTPException

from app.utils.logging_util import get_logger

logger = get_logger(name="cloudinary", log_file="cloudinary.log")

# Load Cloudinary credentials from environment variables
cloud_name = settings.CLOUDINARY_CLOUD_NAME
api_key = settings.CLOUDINARY_API_KEY
api_secret = settings.CLOUDINARY_API_SECRET

# Ensure all required variables are set
if not all([cloud_name, api_key, api_secret]):
    logger.error("Missing required Cloudinary configuration values.")
    raise HTTPException(
        status_code=500,
        detail="Missing Cloudinary configuration values. Ensure that CLOUDINARY_CLOUD_NAME, "
        "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.",
    )

# Configure Cloudinary globally
cloudinary.config(
    cloud_name=cloud_name,
    api_key=api_key,
    api_secret=api_secret,
)


def get_cloudinary_config():
    """
    Returns the current Cloudinary configuration as a dictionary.

    Returns:
        dict: Cloudinary configuration.
    """
    return {
        "cloud_name": cloud_name,
        "api_key": api_key,
        "api_secret": api_secret,
    }
