from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn
from api.database.connect import connect
from api.routers import ping, waitlist, feedback, chat, image
# from api.models.named_entity_recognition import parse_calendar_info
# from api.models.zero_shot_classification import classify_event_type
# from api.functionality.connect_gcal import get_events, authorize

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
load_dotenv()
connect()

app.include_router(ping.router)
app.include_router(waitlist.router)
app.include_router(feedback.router)
app.include_router(chat.router)
app.include_router(image.router)
    

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
