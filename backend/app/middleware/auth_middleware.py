"""
This is a simplified version of the auth middleware that avoids complex type checking issues
with the WorkOS SDK. It implements the same functionality but with a more dynamic approach.
"""

import time
from datetime import datetime
from datetime import timezone as tz
from typing import Any, Awaitable, Callable, Dict, Optional

from app.config.loggers import auth_logger as logger
from app.config.settings import settings
from app.db.mongodb.collections import users_collection
from app.db.redis import set_cache
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from workos import WorkOSClient


class WorkOSAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware for handling WorkOS authentication sessions.

    This middleware processes authentication cookies, validates sessions,
    handles session refreshes, and stores authenticated user data in request.state.
    """

    def __init__(
        self,
        app: ASGIApp,
        workos_client: Optional[WorkOSClient] = None,
        exclude_paths: Optional[list[str]] = None,
    ):
        super().__init__(app)
        # Initialize WorkOS client or use provided one
        self.workos = workos_client or WorkOSClient(
            api_key=settings.WORKOS_API_KEY,
            client_id=settings.WORKOS_CLIENT_ID,
        )
        # Paths that don't need authentication
        self.exclude_paths = exclude_paths or [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/oauth/login",
            "/oauth/workos/callback",
            "/oauth/google/callback",
            "/oauth/logout",
            "/health",
        ]
        # Cache expiry time
        self.user_cache_expiry = 3600  # 1 hour

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """
        Process the request through the authentication middleware.

        Args:
            request: The incoming request
            call_next: Callable to process the request through the next middleware/route

        Returns:
            Response: The response from the route handler with any updated auth cookies
        """
        # Skip authentication for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        # Extract authentication cookies
        wos_session = request.cookies.get("wos_session")

        # Initialize state
        request.state.user = None
        request.state.authenticated = False
        request.state.new_session = None

        # Process authentication if we have a session cookie
        if wos_session:
            try:
                # Authenticate and possibly refresh session
                user_info, new_session = await self._authenticate_session(wos_session)

                if user_info:
                    # Store in request state for dependency injection
                    request.state.user = user_info
                    request.state.authenticated = True

                    # If session was refreshed, store new session token
                    if new_session:
                        request.state.new_session = new_session

            except Exception as e:
                logger.error(f"Authentication middleware error: {e}")
                # Don't block request on auth failures - routes can handle this

        # Process the request
        response = await call_next(request)

        # Update session cookie if session was refreshed
        if hasattr(request.state, "new_session") and request.state.new_session:
            response.set_cookie(
                key="wos_session",
                value=request.state.new_session,
                httponly=True,
                secure=settings.ENV == "production",
                samesite="lax",
                max_age=60 * 60 * 24 * 7,  # 7 days
            )

        return response

    async def _authenticate_session(
        self, wos_session: str
    ) -> tuple[Optional[Dict[str, Any]], Optional[str]]:
        """
        Authenticate a WorkOS session and refresh if needed.

        Args:
            wos_session: WorkOS sealed session from cookie

        Returns:
            tuple: (user_info, new_session_token) - Both can be None if authentication fails

        Raises:
            Exception: On authentication failure
        """
        try:
            # Load and authenticate the WorkOS session
            session = self.workos.user_management.load_sealed_session(
                sealed_session=wos_session,
                cookie_password=settings.WORKOS_COOKIE_PASSWORD,
            )

            auth_response = session.authenticate()
            new_session = None
            workos_user = None

            # Handle authentication result
            if auth_response.authenticated:
                # Authentication successful
                workos_user = auth_response.user
            else:
                # Try to refresh the session
                try:
                    refresh_result = session.refresh()

                    if not refresh_result.authenticated:
                        # Authentication failed, even after refresh
                        return None, None

                    # Get user information
                    workos_user = refresh_result.user  # type: ignore
                    # Get new session token
                    new_session = refresh_result.sealed_session  # type: ignore

                except Exception as e:
                    logger.error(f"Session refresh error: {e}")
                    return None, None

            # Make sure we have a valid user before continuing
            if not workos_user:
                logger.error("Invalid user data from WorkOS")
                return None, new_session

            try:
                # Retrieve user from database
                user_email = workos_user.email
                user_data = await users_collection.find_one({"email": user_email})

                if not user_data:
                    # User doesn't exist in our database
                    logger.warning(
                        f"User {user_email} authenticated but not found in database"
                    )
                    return None, new_session

                # Prepare user info for return
                user_info = {
                    "user_id": str(user_data.get("_id")),
                    "email": user_email,
                    "name": user_data.get("name"),  # Use name from our database
                    "picture": user_data.get("picture"),
                    "auth_provider": "workos",
                }

                # Update user's last activity
                await users_collection.update_one(
                    {"email": user_email},
                    {"$set": {"last_active_at": datetime.now(tz.utc)}},
                )

                # Cache user data in Redis for performance
                cache_key = f"user_cache:{user_email}"
                user_info["cached_at"] = int(time.time())
                await set_cache(cache_key, user_info, self.user_cache_expiry)

                return user_info, new_session

            except Exception as e:
                logger.error(f"Error processing user data: {e}")
                return None, new_session

        except Exception as e:
            logger.error(f"Error in _authenticate_session: {e}")
            return None, None
