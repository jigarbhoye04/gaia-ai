import io
import time
import uuid
from urllib.parse import urlparse

from app.config.loggers import general_logger as logger
import cloudinary.uploader


async def upload_screenshot_to_cloudinary(
    screenshot_bytes: bytes, url: str
) -> str | None:
    """
    Upload a screenshot to Cloudinary and return the secure URL.

    Args:
        screenshot_bytes: The raw bytes of the screenshot
        url: The URL that was screenshotted (for naming purposes)

    Returns:
        str: The secure URL of the uploaded image
    """

    try:
        # Create a unique ID for the screenshot
        screenshot_id = str(uuid.uuid4())

        # Get the hostname for the public_id
        parsed_url = urlparse(url)
        hostname = parsed_url.netloc

        # Create public_id with timestamp, hostname, and UUID to ensure uniqueness
        timestamp = int(time.time())
        public_id = (
            f"screenshots/{hostname.replace('.', '_')}/{timestamp}_{screenshot_id}"
        )

        # Upload the screenshot to Cloudinary
        upload_result = cloudinary.uploader.upload(
            io.BytesIO(screenshot_bytes),
            resource_type="image",
            public_id=public_id,
            overwrite=True,
        )

        image_url = upload_result.get("secure_url")
        if not image_url:
            logger.error("Missing secure_url in Cloudinary upload response")
            return None

        logger.info(f"Screenshot uploaded successfully. URL: {image_url}")
        return image_url

    except Exception as e:
        logger.error(
            f"Failed to upload screenshot to Cloudinary: {str(e)}", exc_info=True
        )
        return None


async def upload_bytes_to_cloudinary(
    bytes_data: bytes,
    file_type: str = "auto",
    folder: str = "uploads",
    public_id: str | None = None,
) -> str:
    """
    Uploads raw bytes data to Cloudinary and returns the secure URL.

    Args:
        bytes_data (bytes): The raw binary data to upload
        file_type (str): Resource type ('auto', 'image', 'raw', etc.)
        folder (str): The folder to store the file in Cloudinary
        public_id (str, optional): Custom public ID for the upload

    Returns:
        str: The secure URL of the uploaded resource

    Raises:
        HTTPException: If the upload to Cloudinary fails
    """
    try:
        from app.config.loggers import cloudinary_logger as logger
        import cloudinary.uploader
        import io
        from fastapi import HTTPException

        # If no public_id is provided, generate one
        if not public_id:
            import uuid

            public_id = f"{folder}/{str(uuid.uuid4())}"

        # Convert bytes to BytesIO for Cloudinary
        file_stream = io.BytesIO(bytes_data)

        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file_stream,
            resource_type=file_type,
            public_id=public_id,
            overwrite=True,
        )

        # Get the secure URL
        secure_url = upload_result.get("secure_url")
        if not secure_url:
            logger.error("Missing secure_url in Cloudinary upload response")
            raise HTTPException(
                status_code=500, detail="Invalid response from upload service"
            )

        logger.info(f"Successfully uploaded to Cloudinary. URL: {secure_url}")
        return secure_url

    except Exception as e:
        from app.config.loggers import cloudinary_logger as logger
        from fastapi import HTTPException

        logger.error(f"Failed to upload bytes to Cloudinary: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
