
from fastapi import APIRouter
from fastapi.responses import StreamingResponse, JSONResponse
from api.validators.request import MessageRequest
from api.functionality.text.text import doPrompt, doPromptNoStream

router = APIRouter()

@router.post("/chat")
def chat(request: MessageRequest):
    return StreamingResponse(doPrompt(request.message), media_type='text/event-stream')

@router.post("/chatNoStream")
def chat(request: MessageRequest):
    return JSONResponse(content=doPromptNoStream(request.message))