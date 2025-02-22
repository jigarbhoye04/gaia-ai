import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.api.v1 import api_router, lifespan, logger
from app.api.v1.routes import general

load_dotenv()


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
    app.add_middleware(SessionMiddleware, secret_key="SECRET_KEY")

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
            "https://heygaia.io",
            "https://heygaia.app",
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
