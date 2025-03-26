"""
Router module for file upload functionality with RAG integration.
"""

from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.models.general_models import FileData
from app.services.file_service import upload_file_service

router = APIRouter()


@router.post("/upload", response_model=FileData, status_code=status.HTTP_201_CREATED)
async def upload_file_endpoint(
    file: UploadFile = File(...),
    conversation_id: str = Form(None),
    user: dict = Depends(get_current_user),
):
    """
    Upload a file to the server and generate embeddings for image files.

    This endpoint uploads files to Cloudinary and stores metadata in MongoDB.
    For image files, it also generates vector embeddings to enable semantic search.

    Args:
        file: The file to upload
        conversation_id: Optional ID of conversation to associate with the file
        user: The authenticated user information

    Returns:
        File metadata including ID, URL, and auto-generated description
    """
    result = await upload_file_service(
        file=file, user_id=user.get("user_id"), conversation_id=conversation_id
    )

    return FileData(
        fileId=result["fileId"],
        url=result["url"],
        filename=result["filename"],
        description=result.get("description"),
        message="File uploaded successfully",
        type=result.get("type", "file"),
    )
