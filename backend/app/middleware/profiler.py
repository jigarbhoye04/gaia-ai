# app/middleware/profiling.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.utils.profiler_utils import profile_block
from app.config.loggers import profiler_logger as logger
from app.config.settings import settings


class ProfilingMiddleware(BaseHTTPMiddleware):
    """Middleware to profile API request execution time."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Only profile in development or when explicitly enabled
        if not settings.ENABLE_PROFILING():
            return await call_next(request)

        # Skip profiling for static assets, health checks, etc.
        path = request.url.path
        if path.startswith(("/static/", "/docs/", "/openapi.json")) or path in {
            "/health",
            "/ping",
            "/api/v1/ping",
            "/api/v1/",
            "/api/v1",
            "/api/v1/oauth/me",
            "/api/v1/conversations",
            "/",
        }:
            return await call_next(request)

        try:
            with profile_block(name=f"Request: {request.method} {path}"):
                response = await call_next(request)
            return response
        except Exception as e:
            # Ensure the application continues even if profiling fails
            logger.exception(f"Profiling error: {str(e)}")
            return await call_next(request)
