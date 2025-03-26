"""
Router module for image generation and image-to-text endpoints.
"""

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse

from app.models.general_models import MessageRequest
from app.services.image_service import (
    api_generate_image,
    generate_image_stream,
    image_to_text_endpoint,
)

router = APIRouter()


@router.post("/image/generate")
async def image(request: MessageRequest):
    """
    Generate an image based on the text prompt.
    """
    response = await api_generate_image(request.message)
    return JSONResponse(content=response)


@router.post("/image/text")
async def imagetotext(message: str = Form(...), file: UploadFile = File(...)):
    """
    Extract text from an image using OCR.
    """
    response = await image_to_text_endpoint(message, file)
    return JSONResponse(content=response)


@router.post("/image/generate/stream")
async def image_stream(request: MessageRequest):
    """
    Generate an image with streaming response.
    """
    return StreamingResponse(
        generate_image_stream(request.message),
        media_type="text/event-stream",
    )
