import logging
import os

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from pydantic import BaseModel
from pymongo.collection import Collection

from app.api.v1.dependencies.oauth_dependencies import (
    get_current_user,
    get_users_collection,
)
from app.services.oauth_service import (
    create_access_token,
    create_tokens,
    google_authenticate,
    verify_refresh_token,
)

logger = logging.getLogger("oauth_routes")

router = APIRouter()
ENVIRONMENT = os.environ.get("ENVIRONMENT", "PROD")


class GoogleLoginPayload(BaseModel):
    """
    Payload for Google OAuth login.
    """

    credential: str
    clientId: str
    select_by: str


@router.post("/google")
async def google_login(
    payload: GoogleLoginPayload,
    response: Response,
    users_collection: Collection = Depends(get_users_collection),
):
    """
    Verify the Google token, create (or find) a user in MongoDB,
    issue access and refresh tokens, and set them as HttpOnly cookies.

    Args:
        payload (GoogleLoginPayload): The Google login payload.
        response (Response): FastAPI response object.
        users_collection (Collection): MongoDB users collection injected via dependency.

    Returns:
        dict: A message and user data.

    Raises:
        HTTPException: If Google authentication fails.
    """
    try:
        user_data = google_authenticate(payload.credential)
    except Exception as e:
        logger.error(f"Google authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {e}",
        )

    # Check if the user exists in the database; if not, insert the new user.
    user = await users_collection.find_one({"email": user_data["email"]})
    if not user:
        await users_collection.insert_one(user_data)
        user = user_data  # Assign user_data since it's the inserted document
    else:
        # Merge the existing user data with the newly authenticated data
        user_data = {**user, **user_data}

    # Convert ObjectId to string
    user_data["_id"] = str(user["_id"]) if "_id" in user else None

    tokens = create_tokens(user_data)

    # Set HttpOnly cookies for tokens with proper security flags.
    response.set_cookie(
        key="access_token",
        value=tokens["access_token"],
        httponly=True,
        secure=True if ENVIRONMENT == "PROD" else False,
        samesite="lax",
        max_age=15 * 60,  # 15 minutes
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=True if ENVIRONMENT == "PROD" else False,
        samesite="lax",
        max_age=30 * 24 * 60 * 60,  # 30 days
    )

    return {"msg": "Login successful", "user": user_data}


@router.post("/refresh")
async def refresh_token(response: Response, refresh_token: str = Cookie(None)):
    """
    Generate a new access token using the refresh token stored in cookies.

    Args:
        response (Response): FastAPI response object.
        refresh_token (str): The refresh token from cookies.

    Returns:
        dict: A message indicating that the access token was refreshed.

    Raises:
        HTTPException: If the refresh token is missing or invalid.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing"
        )

    try:
        user_data = verify_refresh_token(refresh_token)
        new_payload = {"email": user_data.get("email"), "sub": user_data.get("sub")}
        new_access_token = create_access_token(new_payload)
    except Exception as e:
        logger.error(f"Refresh token error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid refresh token: {e}",
        )

    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=15 * 60,  # 15 minutes
    )
    return {"msg": "Access token refreshed"}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Retrieve the authenticated user's information.

    Returns:
        dict: User details including user_id, email, access_token, and cached_at.
    """
    return current_user


@router.post("/logout")
async def logout(response: Response):
    """
    Log out the current user by clearing the authentication cookies.

    Args:
        response (Response): FastAPI response object.

    Returns:
        dict: A message indicating successful logout.
    """
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"msg": "Logout successful"}
