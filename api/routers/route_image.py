
from fastapi import APIRouter, UploadFile, Response, File, APIRouter, Form
from fastapi.responses import Response,JSONResponse
from api.validators.request import MessageRequest
from api.functionality.image import generate_image,convert_image_to_text

router = APIRouter()

@router.post("/generate_image")
def image(request:MessageRequest):
    image_bytes: bytes = generate_image(request.message)
    return Response(content=image_bytes, media_type="image/png")


@router.post("/image")
async def image(
    message: str = Form(...),
    file: UploadFile = File(...)
):
    response = await convert_image_to_text(file, message)
    return JSONResponse(content={"response": response})