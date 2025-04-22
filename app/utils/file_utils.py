"""
Utility functions for file processing including content description generation.
"""

import base64
import io
import os
import tempfile
from typing import List, Optional, Tuple

import docx2txt
import pymupdf
import PyPDF2
import pytesseract
from groq import Groq
from PIL import Image

from app.config.loggers import app_logger as logger
from app.config.settings import settings
from app.models.files_models import DocumentPageModel, DocumentSummaryModel

if not settings.USE_HUGGINGFACE_API:
    from transformers import BlipForConditionalGeneration, BlipProcessor
else:
    from huggingface_hub import InferenceClient

_processor = None
_model = None
_hf_client = None


def get_hf_client():
    """
    Get or initialize the Hugging Face Inference Client.
    Uses the API key from settings.

    Returns:
        InferenceClient: Configured Hugging Face client
    """
    global _hf_client
    if _hf_client is None:
        try:
            _hf_client = InferenceClient(api_key=settings.HUGGINGFACE_API_KEY)
            logger.info("Initialized Hugging Face Inference Client")
        except Exception as e:
            logger.error(f"Failed to initialize Hugging Face client: {str(e)}")
            raise RuntimeError(f"Failed to initialize Hugging Face client: {str(e)}")
    return _hf_client


def get_image_captioning_model() -> Tuple:
    """
    Lazy-load the image captioning model.
    Returns:
        Tuple containing the processor and model for image captioning (if using local)
        or None, None if using Hugging Face API
    """

    global _processor, _model
    if _processor is None or _model is None:
        try:
            logger.info("Loading BLIP image captioning model locally...")
            _processor = BlipProcessor.from_pretrained(
                "Salesforce/blip-image-captioning-base",
                local_files_only=False,  # Set to True once you've downloaded the model
            )
            _model = BlipForConditionalGeneration.from_pretrained(
                "Salesforce/blip-image-captioning-base",
                local_files_only=False,  # Set to True once you've downloaded the model
            )
            logger.info(
                "BLIP image captioning model loaded successfully from local files"
            )
        except Exception as e:
            logger.error(
                f"Failed to load image captioning model: {str(e)}", exc_info=True
            )
            raise
    return _processor, _model


def extract_text_from_image(image: Image.Image) -> str | None:
    """
    Extract text from an image using OCR.
    Args:
        image (PIL.Image): Image object.
    Returns:
        str: Extracted text content.
    """
    try:
        text = pytesseract.image_to_string(image)
        return text.strip() if text.strip() else None
    except Exception as e:
        logger.error(f"Failed to extract text via OCR: {str(e)}", exc_info=True)
        return None


def generate_image_description_groq(image_url: str) -> str:
    try:
        client = Groq()

        completion = client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What's in this image?"},
                        {
                            "type": "image_url",
                            "image_url": {"url": image_url},
                        },
                    ],
                }
            ],
            temperature=1,
            max_completion_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )

        return completion.choices[0].message
    except Exception as e:
        logger.error(
            f"Failed to generate image description via Groq: {str(e)}", exc_info=True
        )
        return "Failed to generate image description via Groq."


def generate_image_description(image_data: bytes, image_url: str) -> str:
    """
    Generate a description for an image using either local model or Hugging Face API.
    Also performs OCR to extract any readable text.

    Args:
        image_data: Raw image bytes
        image_url: URL of the image for additional context
    Returns:
        str: Description of the image content combined with OCR results.
    """
    try:
        try:
            description = generate_image_description_groq(image_url)
            if description:
                logger.info(f"Generated image description via groq: {description}")
                return f"Caption: {description}"
        except Exception as e:
            logger.error(f"Couldn't generate image description via Groq: {str(e)}")

        raw_image = Image.open(io.BytesIO(image_data)).convert("RGB")

        if settings.USE_HUGGINGFACE_API:
            client = get_hf_client()
            image_buffer = io.BytesIO(image_data)

            response = client.image_to_text(
                image_buffer, model=settings.HUGGINGFACE_IMAGE_MODEL
            )

            description = (
                response.generated_text
                if hasattr(response, "generated_text")
                else str(response)
            )
            logger.info(f"Generated image description via HF API: {description}")
        else:
            processor, model = get_image_captioning_model()
            inputs = processor(raw_image, return_tensors="pt")
            out = model.generate(**inputs)
            description = processor.decode(out[0], skip_special_tokens=True)
            logger.info(f"Generated image description via local model: {description}")

        extracted_text = extract_text_from_image(raw_image)
        logger.info(f"OCR Extracted Text: {extracted_text}")

        combined_description = f"Caption: {description}\n {f'OCR Text: {extracted_text}' if extracted_text else ''}"
        return combined_description

    except Exception as e:
        logger.error(f"Failed to generate image description: {str(e)}", exc_info=True)
        return "An image. Description could not be generated."


def extract_text_from_pdf(pdf_data: bytes) -> str:
    """
    Extract text from a PDF file.
    Args:
        pdf_data: Raw PDF file bytes
    Returns:
        str: Extracted text content, truncated if necessary
    """
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_data))
        text = ""

        # Extract text from the first few pages
        max_pages = min(5, len(pdf_reader.pages))
        for i in range(max_pages):
            page = pdf_reader.pages[i]
            text += page.extract_text() + "\n"

        # Truncate if too long
        text = text.strip()
        if len(text) > 500:  # TODO: optimize this to match our max token limit
            text = text[:497] + "..."

        return text if text else "No text content could be extracted from PDF"
    except Exception as e:
        logger.error(f"Failed to extract text from PDF: {str(e)}", exc_info=True)
        return "PDF text content could not be extracted"


def extract_text_from_docx(docx_data: bytes) -> str:
    """
    Extract text from a DOCX file.
    Args:
        docx_data: Raw DOCX file bytes
    Returns:
        str: Extracted text content, truncated if necessary
    """
    try:
        # Create a secure temporary file using the tempfile module
        temp_fd, temp_path = tempfile.mkstemp(suffix=".docx")
        os.close(temp_fd)  # Close the file descriptor

        # Write data to the temporary file
        with open(temp_path, "wb") as f:
            f.write(docx_data)

        text = docx2txt.process(temp_path)

        # Truncate if too long
        text = text.strip()
        if len(text) > 500:
            text = text[:497] + "..."

        return text if text else "No text content could be extracted from document"
    except Exception as e:
        logger.error(f"Failed to extract text from DOCX: {str(e)}", exc_info=True)
        return "Document text content could not be extracted"
    finally:
        # Ensure cleanup happens even if there's an exception
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


def extract_text_from_txt(txt_data: bytes) -> str:
    """
    Extract text from a plain text file.
    Args:
        txt_data: Raw text file bytes
    Returns:
        str: Extracted text content, truncated if necessary
    """
    try:
        text = txt_data.decode("utf-8", errors="replace")

        # Truncate if too long
        text = text.strip()
        if len(text) > 500:
            text = text[:497] + "..."

        return text if text else "No content in text file"
    except Exception as e:
        logger.error(f"Failed to extract text from TXT: {str(e)}", exc_info=True)
        return "Text content could not be extracted"


async def generate_file_description(
    file_content: bytes, file_url: str, content_type: str, filename: str
) -> (
    Optional[str]
    | Optional[DocumentSummaryModel]
    | Optional[List[DocumentSummaryModel]]
):
    """
    Generate a description for a file based on its content type.
    Args:
        file_content: Raw file bytes
        file_url: URL of the uploaded file
        content_type: MIME type of the file
        filename: Name of the file
    Returns:
        Optional[str]: Description of the file content or None if not applicable
    """
    try:
        if content_type.startswith("image/"):
            return generate_image_description(file_content, file_url)

        elif content_type == "application/pdf":
            # return f"PDF content: {extract_text_from_pdf(file_content)}"
            return await generate_pdf_summary(file_content)

        elif (
            content_type
            == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ):
            return f"Document content: {extract_text_from_docx(file_content)}"

        elif content_type.startswith("text/"):
            return f"Text content: {extract_text_from_txt(file_content)}"

        else:
            ext = os.path.splitext(filename)[1].lower()
            return f"File of type {ext} (no content extraction available)"

    except Exception as e:
        logger.error(f"Failed to generate file description: {str(e)}", exc_info=True)
        return f"File description could not be generated for {filename}"


def split_pdf_into_pages(pdf_data: bytes) -> list[DocumentPageModel]:
    """
    Split a PDF file into individual pages and return them as a list of bytes.
    Args:
        pdf_data: Raw PDF file bytes
    Returns:
        list: List of base64-encoded strings representing each page of the PDF
    """
    try:
        pdf_document = pymupdf.open(stream=pdf_data, filetype="pdf")

        images: list[DocumentPageModel] = []
        for page_num in range(pdf_document.page_count):
            page = pdf_document.load_page(page_num)
            pix = page.get_pixmap()
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            buffer = io.BytesIO()
            img.save(buffer, format="PNG")

            images.append(
                DocumentPageModel(
                    page_number=page_num + 1,
                    base64=base64.b64encode(buffer.getvalue()).decode("utf-8"),
                )
            )
            buffer.close()

        pdf_document.close()
        return images
    except Exception as e:
        logger.error(f"Failed to split PDF into pages: {str(e)}", exc_info=True)
        return []


async def summarize_images(images: list[str], max_concurrency) -> list[str]:
    """
    Summarize a list of images using the Groq API.
    Args:
        images: List of base64-encoded strings representing images
    Returns:
        list: List of summaries for each image
    """
    from app.langchain.chatbot import llm_without_tools

    try:
        res = await llm_without_tools.abatch(
            [
                [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """
                                Provide a concise summary of the content in this image. Assume it is part of a document like a PDF or DOCX, and ensure the summary is relevant for semantic search and accurately describes the image.

                                Note: Only respond with the summary text, without any additional information or context.""",
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{img}"},
                            },
                        ],
                    }
                ]
                for img in images
            ],
            config={
                "max_concurrency": max_concurrency,
            },
        )

        summaries = [r.content for r in res]

        return summaries
    except Exception:
        logger.error("Failed to summarize images:", exc_info=True)
        return ["Failed to summarize images."]


async def generate_pdf_summary(pdf_data: bytes) -> list[DocumentSummaryModel]:
    """
    Generate a summary for a PDF file using the Groq API.
    Args:
        pdf_data: Raw PDF file bytes
    Returns:
        str: Summary of the PDF content
    """
    images = split_pdf_into_pages(pdf_data)
    summaries = await summarize_images(
        images=[img.base64 for img in images], max_concurrency=10
    )

    return [
        DocumentSummaryModel(image=img, summary=summary)
        for img, summary in zip(images, summaries)
    ]
