# app/routers/image.py
"""
Router module for image generation and image-to-text endpoints.
"""

from fastapi import UploadFile, File, APIRouter, Form
from fastapi.responses import JSONResponse
from app.models.general_models import MessageRequest
from app.services.image_service import image_service

router = APIRouter()


@router.post("/image/generate")
async def image(request: MessageRequest):
    """
    Endpoint to generate an image based on the provided prompt.

    Args:
        request (MessageRequest): The request body containing the user's message.

    Returns:
        dict: A dictionary containing the URL of the generated image and the improved prompt.
    """
    return await image_service.api_generate_image(request.message)


@router.post("/image/text")
async def imagetotext(message: str = Form(...), file: UploadFile = File(...)):
    """
    Endpoint to convert an uploaded image to text.

    Args:
        message (str): A message accompanying the image.
        file (UploadFile): The uploaded image file.

    Returns:
        JSONResponse: A JSON response containing the extracted text from the image.
    """
    response = await image_service.image_to_text_endpoint(message, file)
    return JSONResponse(content=response)
