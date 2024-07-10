from fastapi import APIRouter
from api.models.text import doPromptNoStream
from fastapi.responses import JSONResponse
from fastapi import UploadFile,File,Form
from api.functionality.document import convert_pdf_to_text

router = APIRouter()

@router.post("/document")
async def upload_file(
    message: str = Form(...),
    file: UploadFile = File(...)
):
    contents = await file.read()
    converted_text = convert_pdf_to_text(contents)
    prompt = f"""
        You can understand documents. 
        Document name: {file.filename}, 
        Content type: {file.content_type}, 
        Size in bytes: {len(contents)}.
        This is the document (converted to text for your convenience): {converted_text}
        I want you to do this: {message}. 
    """

    response = doPromptNoStream(prompt)
    return JSONResponse(content=response)