"""
GAIA API v1 package.

This package contains the API routes and dependencies for version 1 of the GAIA API.
"""

from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
import nltk

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
    blog,
)

# from app.utils.nltk_utils import download_nltk_resources
from app.config.loggers import app_logger as logger


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
api_router.include_router(blog.router, tags=["Blog"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    Handles startup and shutdown events.
    """
    try:
        logger.info("Starting up GAIA API...")
        logger.info("Initializing MongoDB...")
        logger.info("Initializing NLTK for Natural Language Processing...")

        nltk.download("stopwords", quiet=True)
        nltk.download("punkt", quiet=True)

    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise RuntimeError("Startup failed") from e

    yield

    logger.info("Shutting down GAIA API...")
