from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.utils.profiler_utils import Profiler


class ProfilingMiddleware(BaseHTTPMiddleware):
    """Middleware to profile API request execution time."""

    async def dispatch(self, request: Request, call_next) -> Response:
        with Profiler(name=f"Request: {request.url.path}"):
            response = await call_next(request)
        return response
