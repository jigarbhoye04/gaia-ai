"""
Service module for file upload functionality.
"""

import io
import uuid
from datetime import datetime, timezone

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile

from app.config.loggers import app_logger as logger
from app.db.collections import files_collection
from app.utils.file_utils import generate_file_description


async def upload_file_service(file: UploadFile, user_id: str) -> dict:
    """
    Upload a file to Cloudinary and store metadata in MongoDB.

    Args:
        file (UploadFile): The file to upload
        user_id (str): The ID of the user uploading the file

    Returns:
        dict: File metadata including fileId and url

    Raises:
        HTTPException: If file upload fails
    """
    try:
        content = await file.read()

        # Generate a unique ID for the file
        file_id = str(uuid.uuid4())

        public_id = f"file_{file_id}_{file.filename.replace(' ', '_')}"

        upload_result = cloudinary.uploader.upload(
            io.BytesIO(content),
            resource_type="auto",
            public_id=public_id,
            overwrite=True,
        )

        file_url = upload_result.get("secure_url")
        if not file_url:
            logger.error("Missing secure_url in Cloudinary upload response")
            raise HTTPException(
                status_code=500, detail="Invalid response from file upload service"
            )

        file_description = generate_file_description(
            content, file_url, file.content_type, file.filename
        )
        logger.info(f"Generated description for file {file_id}: {file_description}")

        current_time = datetime.now(timezone.utc)
        file_metadata = {
            "file_id": file_id,
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(content),
            "url": file_url,
            "public_id": public_id,
            "user_id": user_id,
            "description": file_description,  # Add the file description
            "created_at": current_time,
            "updated_at": current_time,
        }

        # Store file metadata in MongoDB
        result = await files_collection.insert_one(file_metadata)
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to store file metadata")

        logger.info(f"File uploaded successfully. ID: {file_id}, URL: {file_url}")

        # Return file metadata needed by frontend
        return {
            "fileId": file_id,
            "url": file_url,
            "filename": file.filename,
            "description": file_description,  # Include description in response
        }

    except Exception as e:
        logger.error(f"Failed to upload file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
