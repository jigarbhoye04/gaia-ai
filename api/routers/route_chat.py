from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from api.validators.request import MessageRequest
from api.functionality.text.text import doPrompt, doPromptNoStream
from api.functionality.text.zero_shot_classification import classify_event_type
from api.functionality.authentication import is_user_valid
router = APIRouter()

def test(key:str):
    yield f"""data: {{"response": {{"type" : "{key}"}}}}\n\n"""
    yield """data: [DONE]\n\n"""

@router.post("/chat")
async def chat(request: MessageRequest):
    # data = await classify_event_type(request.message)

    # if(data["generate image"] > 0.75):
    #     return StreamingResponse(test("image"), media_type='text/event-stream')
    # else:
    #     return StreamingResponse(doPrompt(request.message), media_type='text/event-stream')
    return StreamingResponse(doPrompt(request.message), media_type='text/event-stream')
 
@router.post("/chatNoStream")
def chat(request: MessageRequest):
    return JSONResponse(content=doPromptNoStream(request.message))