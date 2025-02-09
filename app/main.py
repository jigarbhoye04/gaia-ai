import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from app.utils.logging import get_logger
from app.api.v1 import api_router, download_nltk_resources

load_dotenv()
logger = get_logger(name="main", log_file="app.log")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up GAIA API...")
    try:
        logger.info("Initializing services and dependencies...")
        logger.info("Downloading nltk resources...")
        download_nltk_resources()

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
)
app.include_router(api_router, prefix="/api/v1")


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


@app.get("api/v1/")
@app.get("api/")
@app.get("api/v1/ping")
@app.get("api/ping")
async def read_root():
    logger.info("Root or ping endpoint accessed.")
    return {"message": "Welcome to the GAIA API!"}


if __name__ == "__main__":
    logger.info("Launching the GAIA API server...")
    try:
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    except Exception as e:
        logger.error(f"Failed to start the server: {e}")
