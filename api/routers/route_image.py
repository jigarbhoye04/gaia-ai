
from cloudinary.utils import cloudinary_url
import cloudinary.uploader
import cloudinary
from fastapi import APIRouter, UploadFile, Response, File, APIRouter, Form
from fastapi.responses import Response, JSONResponse
from schemas.schema_request import MessageRequest
from functionality.image import generate_image, convert_image_to_text
import io
import os

router = APIRouter()


# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


@router.post("/image/generate")
def image(request: MessageRequest):
    image_bytes: bytes = generate_image(request.message)

    # Upload the image bytes to Cloudinary
    upload_result = cloudinary.uploader.upload(
        io.BytesIO(image_bytes),  # Pass the image bytes as a file-like object
        resource_type="image",
        public_id=f"generated_image_{request.message[:20]}",
        overwrite=True
    )

    # Get the URL of the uploaded image
    image_url = upload_result.get("secure_url")

    # Return the Cloudinary image URL in the response
    return {"url": image_url}


@router.post("/image/text")
async def image(
    message: str = Form(...),
    file: UploadFile = File(...)
):
    response = await convert_image_to_text(file, message)
    return JSONResponse(content={"response": response})
