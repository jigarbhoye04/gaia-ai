import io
import os
import cloudinary.uploader
import cloudinary
from fastapi import UploadFile, File, APIRouter, Form, HTTPException
from fastapi.responses import JSONResponse
from app.schemas.common import MessageRequest
from app.services.image import generate_image, convert_image_to_text
from app.services.llm import doPromptNoStream

router = APIRouter()


# Check Cloudinary configuration
cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
api_key = os.getenv("CLOUDINARY_API_KEY")
api_secret = os.getenv("CLOUDINARY_API_SECRET")

# Check if any of the required environment variables are missing
if not cloud_name or not api_key or not api_secret:
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
    improved_prompt = await doPromptNoStream(
        model="@cf/tinyllama/tinyllama-1.1b-chat-v1.0",
        prompt=f"""
            You are an AI assistant skilled at enhancing prompts for generating high-quality, detailed images. Your goal is to take a user's input and refine it by adding vivid descriptions, specific details, and any necessary context to make it more suitable for creating a visually striking and accurate image.

            Identify Key Elements: Analyze the input prompt and identify the subject (what is being depicted), setting (where the scene takes place), style (e.g., realistic, abstract, cartoonish), mood (e.g., calm, dramatic), and any other elements that are present or implied.

            Expand and Specify: Add precise details such as colors, textures, lighting conditions, perspective (e.g., close-up, bird's-eye view), and any significant features that enhance the image's clarity and uniqueness. Ensure the description avoids ambiguity.

            Enhance Creativity: If the user's prompt is too generic or lacks creativity, suggest imaginative elements or combinations that align with the theme while ensuring the output is visually coherent.

            Maintain User Intent: Respect the original theme and focus of the user's input while improving it. Ensure the refined prompt does not deviate from the user's intent.

            Provide a Complete and Detailed Output: Return the improved prompt in a format that is ready for an image generation model to interpret effectively. 
        
            Do not add headings or any descriptive information.
            
            Provide the output in comma-separated keyword format like keyword1, keyword2 etc.

            Now, refine the following user prompt: "{request.message}".

            """,
        temperature=1,
        max_tokens=40,
    )

    refined_text = ", ".join(
        part.strip()
        for part in [request.message or "", improved_prompt.get("response", "") or ""]
        if part.strip()
    )

    if not refined_text:
        raise ValueError(
            "Failed to generate an improved prompt or fallback to the original prompt."
        )

    image_bytes: bytes = await generate_image(refined_text)

    # Upload the image bytes to Cloudinary
    upload_result = cloudinary.uploader.upload(
        io.BytesIO(image_bytes),  # Pass the image bytes as a file-like object
        resource_type="image",
        public_id=f"generated_image_{refined_text[:20]}".strip(),
        overwrite=True,
    )

    # Get the URL of the uploaded image
    image_url = upload_result.get("secure_url")

    # Return the Cloudinary image URL in the response
    return {
        "url": image_url,
        "improved_prompt": improved_prompt.get("response", improved_prompt),
    }


@router.post("/image/text")
async def imagetotext(message: str = Form(...), file: UploadFile = File(...)):
    response = await convert_image_to_text(file, message)
    return JSONResponse(content={"response": response})
