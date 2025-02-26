# app/services/image_service_handler.py
"""
Service module for handling image generation and image-to-text conversion.
"""

import io
import os
import re
import uuid

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException

from app.config.config_cloudinary import get_cloudinary_config
from app.services.llm_service import llm_service
from app.utils.image_utils import convert_image_to_text, generate_image
from app.utils.logging_util import get_logger


def generate_public_id(refined_text: str, max_length: int = 50) -> str:
    slug = re.sub(r"\s+", "-", refined_text.lower())
    slug = re.sub(r"[^a-z0-9\-]", "", slug)
    slug = slug[:max_length]
    unique_suffix = uuid.uuid4().hex[:8]
    return f"generated_image_{slug}_{unique_suffix}"


class ImageService:
    """
    Service class for handling image generation and image-to-text conversion.
    """

    def __init__(self):
        """
        Initialize the ImageService, including Cloudinary configuration.

        Raises:
            HTTPException: If any required Cloudinary configuration environment variables are missing.
        """
        self.logger = get_logger(name="image", log_file="image.log")
        self.llm_service = llm_service
        self.cloudinary_config = get_cloudinary_config()

        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
        api_key = os.getenv("CLOUDINARY_API_KEY")
        api_secret = os.getenv("CLOUDINARY_API_SECRET")

        if not cloud_name or not api_key or not api_secret:
            self.logger.error("Missing required Cloudinary configuration values.")
            raise HTTPException(
                status_code=500,
                detail="Missing required Cloudinary configuration values. Ensure that CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.",
            )

        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
        )

    async def api_generate_image(self, message: str) -> dict:
        """
        Generate an image based on the provided message prompt and upload it to Cloudinary.

        Args:
            message (str): The user's input prompt for image generation.

        Returns:
            dict: A dictionary containing the URL of the uploaded image and the improved prompt.

        Raises:
            HTTPException: If an error occurs during image generation or upload.
        """
        try:
            self.logger.info(f"Received image generation request: {message}")

            improved_prompt = await self.llm_service.do_prompt_no_stream(
                prompt=f"""
                You are an AI assistant specialized in refining prompts for generating high-quality images. Your task is to take the given prompt and enhance it by adding relevant keywords that improve detail, clarity, and visual accuracy.  
                
                **Instructions:**  
                - Output should be a comma-separated list of keywords.  
                - Focus on improving descriptions by adding details about colors, lighting, mood, perspective, environment, and relevant objects.  
                - Do not generate a full sentence or a story.  
                
                Original user prompt: "{message}"  

                Now, refine this prompt into a comma-separated list of descriptive keywords.
            """,
                temperature=1,
                max_tokens=50,
            )
            print(improved_prompt, "improved_prompt this is a test")
            refined_text = ", ".join(
                part.strip()
                for part in [
                    message or "",
                    improved_prompt.get("response", "") or "",
                ]
                if part.strip()
            )

            print(refined_text, "refined_text this is a test")

            if not refined_text:
                self.logger.error("Failed to generate an improved prompt.")
                raise ValueError(
                    "Failed to generate an improved prompt or fallback to the original prompt."
                )

            self.logger.info(f"Generated refined prompt: {refined_text}")

            image_bytes: bytes = await generate_image(refined_text)

            print(refined_text, "refined_text this is a test")

            self.logger.info("Image generated successfully. Uploading to Cloudinary...")

            # Upload the image bytes to Cloudinary
            upload_result = cloudinary.uploader.upload(
                io.BytesIO(image_bytes),
                resource_type="image",
                public_id=generate_public_id(refined_text),
                overwrite=True,
            )

            image_url = upload_result.get("secure_url")
            self.logger.info(f"Image uploaded successfully. URL: {image_url}")

            return {
                "url": image_url,
                "improved_prompt": improved_prompt.get("response", improved_prompt),
            }

        except Exception as e:
            self.logger.error(
                f"Error occurred while processing image generation: {str(e)}"
            )
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def image_to_text_endpoint(self, message: str, file) -> dict:
        """
        Convert an uploaded image to text.

        Args:
            message (str): A message accompanying the image.
            file (UploadFile): The uploaded image file.

        Returns:
            dict: A dictionary containing the extracted text from the image.

        Raises:
            HTTPException: If an error occurs during the image-to-text conversion process.
        """
        try:
            self.logger.info(f"Received image-to-text request with message: {message}")

            response = await convert_image_to_text(file, message)

            self.logger.info("Image-to-text conversion successful.")
            return {"response": response}

        except Exception as e:
            self.logger.error(
                f"Error occurred while processing image-to-text: {str(e)}"
            )
            raise HTTPException(status_code=500, detail="Internal Server Error")


image_service = ImageService()
