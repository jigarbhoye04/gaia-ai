"""
Middleware configuration for the GAIA FastAPI application.

This module provides functions to configure middleware for the FastAPI application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config.settings import settings
from app.middleware.profiler import ProfilingMiddleware
from app.middleware.rate_limiter import limiter


def configure_middleware(app: FastAPI) -> None:
    """
    Configure middleware for the FastAPI application.

    Args:
        app (FastAPI): FastAPI application instance
    """

    # Attach limiter to app state
    app.state.limiter = limiter

    # Exception handler for rate limiting
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Add rate limiting middleware
    app.add_middleware(SlowAPIMiddleware)

    # Add profiling middleware for logging request/response times
    app.add_middleware(ProfilingMiddleware)

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_allowed_origins(),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
    )


def get_allowed_origins() -> list[str]:
    """
    Get allowed origins for CORS based on environment.

    Returns:
        list[str]: List of allowed origins
    """
    # Always include configured frontend URL
    allowed_origins = [settings.FRONTEND_URL]

    # Add additional origins based on environment
    if settings.ENV == "production":
        # Only allow trusted HTTPS origins in production
        allowed_origins.extend(
            [
                "https://heygaia.io",
                "https://heygaia.app",
            ]
        )
    else:
        # Allow development origins
        allowed_origins.extend(
            [
                "http://localhost:5173",
                "https://localhost:5173",
                "http://localhost:3000",
                "http://192.168.138.215:5173",
                "https://192.168.13.215:5173",
            ]
        )

    return allowed_origins
