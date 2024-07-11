from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn
from api.database.connect import connect
from api.routers import ping, waitlist, feedback, chat, image,auth

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://gaia.aryanranderiya.com","http://192.168.138.215:5173"],
    allow_credentials=True,
    allow_methods=["GET","POST"],
    allow_headers=["*"],
)
load_dotenv()
connect()

app.include_router(ping.router)
app.include_router(waitlist.router)
app.include_router(feedback.router)
app.include_router(chat.router)
app.include_router(image.router)
app.include_router(auth.router)
    

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
