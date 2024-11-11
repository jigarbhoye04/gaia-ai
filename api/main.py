from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn
from database.connect import connect
from routers import route_auth, route_chat, route_document, route_feedback, route_image, route_ping, route_waitlist, route_oauth

app = FastAPI()
origins = [
    "http://localhost:5173",
    "https://gaia.aryanranderiya.com",
    "http://192.168.138.215:5173",
    "https://localhost:5173",
    "https://192.168.13.215:5173"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

load_dotenv()
connect()

app.include_router(route_ping.router, prefix="/api/v1")
app.include_router(route_waitlist.router, prefix="/api/v1")
app.include_router(route_feedback.router, prefix="/api/v1")
app.include_router(route_chat.router, prefix="/api/v1")
app.include_router(route_image.router, prefix="/api/v1")
app.include_router(route_document.router, prefix="/api/v1")
app.include_router(route_auth.router, prefix="/api/v1")
app.include_router(route_oauth.router, prefix="/api/v1/oauth")
# app.include_router(route_gmail.router, prefix="/api/v1")


@app.get("/")
async def read_root():
    return {"message": "Welcome to the GAIA API!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
