from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from schemas.schema_request import MessageRequest
from functionality.text.text import doPrompt, doPromptNoStream
from functionality.text.zero_shot_classification import classify_event_type
# from functionality.authentication import is_user_valid
router = APIRouter()


def test(key: str):
    yield f"""data: {{"response": {{"type" : "{key}"}}}}\n\n"""
    yield """data: [DONE]\n\n"""


@router.post("/chat-stream")
async def chat(request: MessageRequest):
    # data = await classify_event_type(request.message)

    # if(data["generate image"] > 0.75):
    #     return StreamingResponse(test("image"), media_type='text/event-stream')
    # else:
    #     return StreamingResponse(doPrompt(request.message), media_type='text/event-stream')
    return StreamingResponse(doPrompt(request.message), media_type='text/event-stream')


@router.post("/chat")
def chat(request: MessageRequest):
    return JSONResponse(content=doPromptNoStream(request.message))
