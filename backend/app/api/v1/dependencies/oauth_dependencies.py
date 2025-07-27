from datetime import datetime
from zoneinfo import ZoneInfo

from app.config.loggers import auth_logger as logger
from fastapi import Header, HTTPException, Request


async def get_current_user(request: Request):
    """
    Retrieves the current user from request state.
    Authentication is handled by the WorkOSAuthMiddleware.

    Args:
        request: FastAPI request object with authenticated user in state

    Returns:
        User data dictionary with authentication info

    Raises:
        HTTPException: On authentication failure
    """
    if not hasattr(request.state, "authenticated") or not request.state.authenticated:
        logger.info("No authenticated user found in request state")
        raise HTTPException(
            status_code=401, detail="Unauthorized: Authentication required"
        )

    if not request.state.user:
        logger.error("User marked as authenticated but no user data found")
        raise HTTPException(status_code=401, detail="Unauthorized: User data missing")

    # Return user info from request state
    return request.state.user


def get_user_timezone(
    x_timezone: str = Header(
        default="UTC", alias="x-timezone", description="User's timezone identifier"
    ),
) -> datetime:
    """
    Get the current time in the user's timezone.
    Uses the x-timezone header to determine the user's timezone.

    Args:
        x_timezone (str): The timezone identifier from the request header.
    Returns:
        datetime: The current time in the user's timezone.
    """
    user_tz = ZoneInfo(x_timezone)
    now = datetime.now(user_tz)

    logger.debug(f"User timezone: {user_tz}, Current time: {now}")
    return now
