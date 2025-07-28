import inspect
from functools import wraps
from typing import Any, Awaitable, Callable, TypeVar, cast

import httpx
from fastapi import HTTPException

from app.config.loggers import calendar_logger as logger
from app.config.token_repository import token_repository

# T is the return type of the wrapped function
T = TypeVar("T")


async def _refresh_token(user_id: str, provider: str) -> str:
    """
    Helper function to refresh an OAuth token.

    Args:
        user_id: The user ID for token refresh
        provider: The provider name (e.g., "google")

    Returns:
        str: The refreshed access token

    Raises:
        HTTPException: If token refresh fails
    """
    logger.info(f"Access token expired for user {user_id}, attempting refresh")
    token = await token_repository.refresh_token(user_id, provider)
    if not token:
        raise HTTPException(status_code=401, detail="Failed to refresh authentication")

    new_access_token = str(token.get("access_token", ""))
    if not new_access_token:
        raise HTTPException(
            status_code=401, detail="Failed to get access token after refresh"
        )

    return new_access_token


async def with_token_refresh(
    user_id: str,
    provider: str,
    func: Callable[..., Awaitable[T]],
    *args: Any,
    **kwargs: Any,
) -> T:
    """
    Execute a function with token refresh capability.
    If the function raises a 401 HTTPException, try to refresh the token and retry.

    Args:
        user_id: The user ID for token refresh
        provider: The provider name (e.g., "google")
        func: The function to execute
        args: Positional arguments to pass to the function
        kwargs: Keyword arguments to pass to the function

    Returns:
        The result of the function
    """
    try:
        # Try to execute the function with current credentials
        return await func(*args, **kwargs)
    except HTTPException as e:
        if e.status_code == 401:
            # Refresh token
            new_access_token = await _refresh_token(user_id, provider)

            # Update the access_token in kwargs if it exists
            if "access_token" in kwargs:
                kwargs["access_token"] = new_access_token

            # Try again with the new token
            logger.info(f"Retrying API call with refreshed token for user {user_id}")
            return await func(*args, **kwargs)
        else:
            # If it's not a 401, re-raise the exception
            raise
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401 and user_id:
            # Refresh token
            new_access_token = await _refresh_token(user_id, provider)

            # Update the access_token in kwargs if it exists
            if "access_token" in kwargs:
                kwargs["access_token"] = new_access_token

            # Try again with the new token
            logger.info(f"Retrying API call with refreshed token for user {user_id}")
            return await func(*args, **kwargs)
        else:
            # Convert HTTPStatusError to HTTPException with details
            error_detail = "Unknown error"
            try:
                error_json = e.response.json()
                if isinstance(error_json, dict):
                    error_message = error_json.get("error", {})
                    if isinstance(error_message, dict):
                        error_detail = error_message.get("message", "Unknown error")
            except Exception:
                error_detail = str(e)

            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"API request failed: {error_detail}",
            )


def auth_required(provider: str = "google"):
    """
    Decorator that handles token refresh for API calls.

    Usage:
        @auth_required()
        async def my_function(user_id: str, access_token: str, ...):
            # Function implementation

    Args:
        provider: The provider name (e.g., "google")

    Returns:
        Decorated function with token refresh capability
    """

    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            # Find user_id in the arguments
            user_id = kwargs.get("user_id")
            if not user_id:
                # Look for user_id in positional args based on function signature
                sig = inspect.signature(func)
                param_names = list(sig.parameters.keys())
                for i, param_name in enumerate(param_names):
                    if param_name == "user_id" and i < len(args):
                        user_id = args[i]
                        break

            if not user_id:
                # No user_id found, can't handle token refresh
                return await func(*args, **kwargs)

            # Remove user_id from kwargs and args if it exists
            if "user_id" in kwargs:
                del kwargs["user_id"]
            if user_id in args:
                args = tuple(arg for arg in args if arg != user_id)

            # Fix: We need to avoid passing the same parameter both as keyword and in *args/**kwargs
            async def call_func():
                return await with_token_refresh(
                    user_id=cast(str, user_id),
                    provider=provider,
                    func=func,
                    *args,
                    **kwargs,
                )

            return await call_func()

        return wrapper

    return decorator
