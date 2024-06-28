from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

# from models.spacy_ner import parse_calendar_info
# from models.zero_shot_classification import classify_event_type
from models.llama import doPrompt

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()


class MessageRequest(BaseModel):
    message: str


class MessageResponse(BaseModel):
    response: str


@ app.post("/chat")
def chat(request: MessageRequest):
    return StreamingResponse(doPrompt(request.message), media_type='text/event-stream')


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
