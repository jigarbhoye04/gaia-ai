
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from api.validators.request import MessageRequest
from api.functionality.text.text import doPrompt

router = APIRouter()

@router.post("/chat")
def chat(request: MessageRequest):
    return StreamingResponse(doPrompt(request.message), media_type='text/event-stream')