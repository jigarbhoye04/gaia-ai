from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI

from app.api.v1.routes import (
    audio,
    calendar,
    chat,
    document,
    feedback,
    goals,
    image,
    mail,
    notes,
    oauth,
    search,
    waitlist,
)
from app.utils.logging_util import get_logger
from app.utils.nltk_utils import download_nltk_resources

logger = get_logger(name="main", log_file="app.log")

api_router = APIRouter()

api_router.include_router(waitlist.router, tags=["Waitlist"])
api_router.include_router(feedback.router, tags=["Feedback"])
api_router.include_router(chat.router, tags=["Chat"])
api_router.include_router(image.router, tags=["Image"])
api_router.include_router(document.router, tags=["Document"])
api_router.include_router(search.router, tags=["Search"])
api_router.include_router(calendar.router, tags=["Calendar"])
api_router.include_router(notes.router, tags=["Notes/Memories"])
api_router.include_router(goals.router, tags=["Goals"])
api_router.include_router(oauth.router, prefix="/oauth", tags=["OAuth"])
api_router.include_router(audio.router, tags=["Audio"])
api_router.include_router(mail.router, tags=["Mail"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    Handles startup and shutdown events.
    """
    try:
        logger.info("Starting up GAIA API...")
        logger.info("Initializing services and dependencies...")
        logger.info("Downloading NLTK resources...")
        download_nltk_resources()
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise RuntimeError("Startup failed") from e

    yield

    logger.info("Shutting down GAIA API...")
