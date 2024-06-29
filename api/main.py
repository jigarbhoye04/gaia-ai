from fastapi import FastAPI, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn
from validators import MessageRequest, MessageResponse
from models.named_entity_recognition import parse_calendar_info
from models.zero_shot_classification import classify_event_type
from models.llama import doPrompt
from functionality.document import convert_pdf_to_text
# from functionality.connect_gcal import get_events, authorize

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()


@ app.post("/chat")
def chat(request: MessageRequest):
    return StreamingResponse(doPrompt(request.message), media_type='text/event-stream')


@app.post("/convert_pdf")
async def convert_pdf(file: UploadFile):
    print(file)
    contents = await file.read()
    return {
        "name": file.filename,
        "file_size_bytes": len(contents),
        "content_type": file.content_type,
        "text":  convert_pdf_to_text(contents),
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
