"""
Router module for file upload functionality.
"""

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.models.general_models import FileUploadResponse
from app.services.file_service import upload_file_service

router = APIRouter()


@router.post(
    "/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED
)
async def upload_file_endpoint(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """
    Upload a file to the server.

    Args:
        file: The file to upload
        user: The authenticated user information

    Returns:
        File metadata including ID, URL, and auto-generated description
    """
    result = await upload_file_service(file, user.get("user_id"))
    return FileUploadResponse(
        fileId=result["fileId"],
        url=result["url"],
        filename=result["filename"],
        description=result.get("description"),
    )
