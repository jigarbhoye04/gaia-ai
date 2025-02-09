import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from app.utils.logging_util import get_logger
from app.utils.nltk_utils import download_nltk_resources
from app.api.v1 import api_router
from app.api.v1.routes import (
    general,
)

load_dotenv()

logger = get_logger(name="main", log_file="app.log")


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


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Returns:
        FastAPI: The configured FastAPI application.
    """
    app = FastAPI(
        lifespan=lifespan,
        title="GAIA API",
        version="1.0.0",
        description="The AI assistant backend",
    )

    app.include_router(api_router, prefix="/api/v1")
    api_router.include_router(
        general.router,
    )

    # Add CORS middleware.
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

    return app


app = create_app()


@app.get("/")
@app.get("/ping")
@app.get("/api/v1/")
@app.get("/api/v1/ping")
def main_route():
    return {"hello": "world"}


if __name__ == "__main__":
    logger.info("Launching the GAIA API server...")
    try:
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    except Exception as e:
        logger.error(f"Failed to start the server: {e}")
