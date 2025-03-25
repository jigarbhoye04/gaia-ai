"""
Main module for the GAIA FastAPI application.

This module initializes and configures the FastAPI application, including middleware,
routers, and other settings.
"""

from fastapi.responses import FileResponse
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.api.v1 import api_router, lifespan, logger
from app.middleware.profiling import ProfilingMiddleware

app = FastAPI(
    lifespan=lifespan,
    title="GAIA API",
    version="1.0.0",
    description="The AI assistant backend",
)

app.add_middleware(ProfilingMiddleware)
app.add_middleware(SessionMiddleware, secret_key="SECRET_KEY")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://localhost:5173",
        "http://localhost:3000",
        "http://192.168.138.215:5173",
        "https://192.168.13.215:5173",
        "https://heygaia.io",
        "https://heygaia.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
@app.get("/ping")
@app.get("/health")
@app.get("/api/v1/")
@app.get("/api/v1/ping")
def main_route():
    """
    Returns:
        dict: A simple greeting message.
    """
    return {"hello": "world"}


if __name__ == "__main__":
    logger.info("Launching the GAIA API server...")
    try:
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    except Exception as e:
        logger.error(f"Failed to start the server: {e}")
