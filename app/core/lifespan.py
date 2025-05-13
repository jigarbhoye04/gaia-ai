from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config.cloudinary import init_cloudinary
from app.config.loggers import app_logger as logger
from app.db.chromadb import init_chroma
from app.langchain.graph_builder import build_graph
from app.langchain.graph_manager import GraphManager
from app.utils.nltk_utils import download_nltk_resources
from app.utils.text_utils import get_zero_shot_classifier


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    Handles startup and shutdown events.
    """
    try:
        logger.info("Starting up the API...")
        await init_chroma(app)
        download_nltk_resources()
        get_zero_shot_classifier()
        init_cloudinary()

        # Initialize the graph and store in GraphManager
        async with build_graph() as built_graph:
            GraphManager.set_graph(built_graph)
            yield
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise RuntimeError("Startup failed") from e
    finally:
        logger.info("Shutting down the API...")
