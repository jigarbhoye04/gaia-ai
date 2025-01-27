import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from app.utils.logging import get_logger
import app.db.connect
from app.api.v1 import (
    auth,
    chat,
    document,
    # audio,
    feedback,
    gcalendar,
    image,
    oauth,
    waitlist,
    goals,
    notes,
)

load_dotenv()
logger = get_logger(name="main", log_file="app.log")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up GAIA API...")
    try:
        logger.info("Initializing services and dependencies...")
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise RuntimeError("Startup failed")

    yield

    logger.info("Shutting down GAIA API...")


app = FastAPI(
    lifespan=lifespan,
    title="GAIA API",
    version="1.0.0",
    description="The AI assistant backend",
    openapi_prefix="/api/v1",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://localhost:5173",
        "http://192.168.138.215:5173",
        "https://192.168.13.215:5173",
        "https://gaia.aryanranderiya.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(waitlist.router, tags=["Waitlist"])
logger.info("Waitlist router added.")
app.include_router(feedback.router, tags=["Feedback"])
logger.info("Feedback router added.")
app.include_router(chat.router, tags=["Chat"])
logger.info("Chat router added.")
app.include_router(image.router, tags=["Image"])
logger.info("Image router added.")
app.include_router(auth.router, tags=["Authentication"])
logger.info("Authentication router added.")
# app.include_router(audio.router, tags=["Audio"])
logger.info("Audio router added.")
app.include_router(document.router, tags=["Document"])
logger.info("Document router added.")
app.include_router(gcalendar.router, tags=["Calendar"])
logger.info("Calendar router added.")
app.include_router(notes.router, tags=["Notes/Memories"])
logger.info("Notes/Memories router added.")
app.include_router(goals.router, tags=["Goals"])
logger.info("Goals router added.")
app.include_router(oauth.router, prefix="/oauth", tags=["OAuth"])
logger.info("OAuth router added.")


@app.get("/")
@app.get("/ping")
async def read_root():
    logger.info("Root or ping endpoint accessed.")
    return {"message": "Welcome to the GAIA API!"}


if __name__ == "__main__":
    logger.info("Launching the GAIA API server...")
    try:
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    except Exception as e:
        logger.error(f"Failed to start the server: {e}")
