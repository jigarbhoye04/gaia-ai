
from fastapi import APIRouter, UploadFile, Response, File, APIRouter, Form
from fastapi.responses import Response, JSONResponse
from schemas.schema_request import MessageRequest
from functionality.image import generate_image, convert_image_to_text

router = APIRouter()


@router.post("/image/generate")
def image(request: MessageRequest):
    image_bytes: bytes = generate_image(request.message)
    return Response(content=image_bytes, media_type="image/png")


@router.post("/image/text")
async def image(
    message: str = Form(...),
    file: UploadFile = File(...)
):
    response = await convert_image_to_text(file, message)
    return JSONResponse(content={"response": response})
