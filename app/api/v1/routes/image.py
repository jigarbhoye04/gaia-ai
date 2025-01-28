import io
import os
import cloudinary.uploader
import cloudinary
from fastapi import UploadFile, File, APIRouter, Form, HTTPException
from fastapi.responses import JSONResponse
from app.schemas.common import MessageRequest
from app.services.image import generate_image, convert_image_to_text
from app.services.llm import doPromptNoStream
from app.utils.logging import get_logger

logger = get_logger(name="image", log_file="image.log")

router = APIRouter()

# Check Cloudinary configuration
cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
api_key = os.getenv("CLOUDINARY_API_KEY")
api_secret = os.getenv("CLOUDINARY_API_SECRET")

# Check if any of the required environment variables are missing
if not cloud_name or not api_key or not api_secret:
    logger.error("Missing required Cloudinary configuration values.")
    raise HTTPException(
        status_code=500,
        detail="Missing required Cloudinary configuration values. Ensure that CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.",
    )

# Configure Cloudinary if all values are present
cloudinary.config(
    cloud_name=cloud_name,
    api_key=api_key,
    api_secret=api_secret,
)


@router.post("/image/generate")
async def image(request: MessageRequest):
    try:
        logger.info(f"Received image generation request: {request.message}")

        improved_prompt = await doPromptNoStream(
            prompt=f"""
                You are an AI assistant skilled at enhancing prompts for generating high-quality, detailed images. Your goal is to take a user's input and refine it by adding vivid descriptions, specific details, and any necessary context to make it more suitable for creating a visually striking and accurate image.
                Now, refine the following user prompt: "{request.message}".
            """,
            temperature=1,
            max_tokens=100,
        )

        refined_text = ", ".join(
            part.strip()
            for part in [
                request.message or "",
                improved_prompt.get("response", "") or "",
            ]
            if part.strip()
        )

        if not refined_text:
            logger.error("Failed to generate an improved prompt.")
            raise ValueError(
                "Failed to generate an improved prompt or fallback to the original prompt."
            )

        logger.info(f"Generated refined prompt: {refined_text}")

        image_bytes: bytes = await generate_image(refined_text)

        logger.info("Image generated successfully. Uploading to Cloudinary...")

        # Upload the image bytes to Cloudinary
        upload_result = cloudinary.uploader.upload(
            io.BytesIO(image_bytes),
            resource_type="image",
            public_id=f"generated_image_{refined_text[:20]}".strip(),
            overwrite=True,
        )

        # Get the URL of the uploaded image
        image_url = upload_result.get("secure_url")
        logger.info(f"Image uploaded successfully. URL: {image_url}")

        return {
            "url": image_url,
            "improved_prompt": improved_prompt.get("response", improved_prompt),
        }

    except Exception as e:
        logger.error(f"Error occurred while processing image generation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post("/image/text")
async def imagetotext(message: str = Form(...), file: UploadFile = File(...)):
    try:
        logger.info(f"Received image-to-text request with message: {message}")

        response = await convert_image_to_text(file, message)

        logger.info("Image-to-text conversion successful.")
        return JSONResponse(content={"response": response})

    except Exception as e:
        logger.error(f"Error occurred while processing image-to-text: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
