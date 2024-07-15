from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn
from api.database.connect import connect
from api.routers import route_auth, route_chat, route_document, route_feedback, route_image, route_ping, route_waitlist
import logging

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://gaia.aryanranderiya.com","http://192.168.138.215:5173","https://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET","POST"],
    allow_headers=["*"],
)

load_dotenv()
connect()


# logging.basicConfig(level=logging.DEBUG, format='%(message)s')

app.include_router(route_ping.router)
app.include_router(route_waitlist.router)
app.include_router(route_feedback.router)
app.include_router(route_chat.router)
app.include_router(route_image.router)
app.include_router(route_document.router)
app.include_router(route_auth.router)
    

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
