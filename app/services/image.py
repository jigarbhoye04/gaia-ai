import requests
from fastapi import UploadFile, File, HTTPException, Form
from PIL import Image
from io import BytesIO
from app.services.llm import doPromptNoStream
import httpx

http_async_client = httpx.AsyncClient(timeout=100000)


async def generate_image(imageprompt: str) -> dict:
    url = "https://generateimage.aryanranderiya1478.workers.dev/"
    try:
        response = await http_async_client.post(url, json={"imageprompt": imageprompt})
        response.raise_for_status()
        return response.content
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return {"error": str(e)}


def compress_image(image_bytes, sizing=0.4, quality=85):
    try:
        image = Image.open(BytesIO(image_bytes))
        output_io = BytesIO()

        new_width = int(image.width * sizing)
        new_height = int(image.height * sizing)
        resized_image = image.resize((new_width, new_height), Image.LANCZOS)

        resized_image.save(output_io, format="JPEG", optimize=True, quality=quality)
        compressed_image_bytes = output_io.getvalue()

        print({"original": len(image_bytes), "compressed": len(compressed_image_bytes)})
        return compressed_image_bytes

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to compress image: {str(e)}"
        )


async def convert_image_to_text(
    image: UploadFile = File(...),
    message: str = Form(...),
) -> dict:
    contents = await image.read()
    url = "https://imageunderstanding.aryanranderiya1478.workers.dev/"

    try:
        if len(contents) >= 1 * 1024 * 1024 and len(contents) <= 2 * 1024 * 1024:
            compressed_image = compress_image(contents, sizing=0.9, quality=95)
            contents = compressed_image
        elif len(contents) >= 2 * 1024 * 1024 and len(contents) <= 6 * 1024 * 1024:
            compressed_image = compress_image(contents)
            contents = compressed_image

        if len(contents) > 1 * 1024 * 1024:
            return "File too large"

        improved_prompt = await doPromptNoStream(
            prompt=f"""Convert this sentence to proper formatting, proper formal grammer for a prompt sent with an image: '{
                message
            }'. Only give me the sentence without any additional headers or information. Be concise, but descriptive."""
        )

        response = requests.post(
            url, files={"image": contents}, data={"prompt": improved_prompt["response"]}
        )
        response.raise_for_status()
        return response.json()

    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return {"error": str(e)}
