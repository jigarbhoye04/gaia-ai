# app/routes/auth.py
from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import RedirectResponse, JSONResponse
from authlib.integrations.starlette_client import OAuthError
from app.utils.auth_utils import oauth
from app.services.oauth_service import get_or_create_user, create_access_token
from datetime import timedelta
import os

router = APIRouter()


@router.get("/google")
async def login_via_google(request: Request):
    """
    Redirect the user to Google's OAuth 2.0 authorization page.

    :param request: FastAPI Request object.
    :return: RedirectResponse to Google's OAuth consent page.
    """
    try:
        redirect_uri = request.url_for("auth_callback")
        # Authlib automatically handles state parameter creation and validation.
        return await oauth.google.authorize_redirect(request, redirect_uri)
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Failed to initiate Google OAuth: {str(e)}"},
        )


@router.get("/google/callback", name="auth_callback")
async def auth_callback(request: Request):
    """
    Handle the callback from Google OAuth 2.0.
    Exchange the authorization code for an access token and retrieve user information.
    Sets the JWT in a secure HTTP-only cookie.

    :param request: FastAPI Request object.
    :return: RedirectResponse to the frontend.
    """
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as error:
        raise HTTPException(status_code=400, detail=f"OAuth error: {error.error}")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Unexpected error during token exchange: {str(e)}"
        )

    try:
        # Parse the ID token to get user information.
        user_info = await oauth.google.parse_id_token(request, token)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to parse user information: {str(e)}"
        )

    # Get (or create) the user in MongoDB.
    try:
        user = await get_or_create_user(user_info)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # Create a JWT token for the authenticated user.
    access_token_expires = timedelta(
        minutes=int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    )
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=access_token_expires
    )

    # Prepare a redirect response to the frontend.
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    response = RedirectResponse(url=frontend_url)

    # Set the access token in an HTTP-only cookie.
    # The `secure` flag ensures the cookie is only sent over HTTPS.
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,  # Ensure to use HTTPS in production.
        samesite="lax",  # Adjust SameSite attribute as needed.
        max_age=access_token_expires.total_seconds(),
    )

    return response
