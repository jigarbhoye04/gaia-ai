"""
Main module for the GAIA FastAPI application.

This module initializes and configures the FastAPI application, including middleware,
routers, and other settings.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1 import api_router, lifespan
from app.middleware.profiling import ProfilingMiddleware
from app.config.settings import settings

os.environ["TOKENIZERS_PARALLELISM"] = "false"


app = FastAPI(
    lifespan=lifespan,
    title="GAIA API",
    description="Backend for General-purpose AI assistant (GAIA)",
    contact={
        "name": "Aryan Randeriya",
        "url": "http://aryanranderiya.com",
        "email": "aryan@heygaia.io",
    },
    docs_url=None if settings.ENV == "production" else "/docs",
    redoc_url=None if settings.ENV == "production" else "/redoc",
)

app.add_middleware(ProfilingMiddleware)
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
    return {
        "status": "success",
        "message": "Welcome to the GAIA API!",
    }


app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse("app/static/favicon.ico")
