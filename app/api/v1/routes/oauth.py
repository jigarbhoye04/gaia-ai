from typing import Annotated

import httpx
import requests
from app.db.collections import users_collection
from app.services.oauth_service import store_user_info
from app.utils.auth_utils import (
    GOOGLE_CALLBACK_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_TOKEN_URL,
    GOOGLE_USERINFO_URL,
)
from app.utils.logging_util import get_logger
from dotenv import load_dotenv
from fastapi import APIRouter, Cookie, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from urllib.parse import urlencode

router = APIRouter()
load_dotenv()

logger = get_logger(name="authentication", log_file="auth.log")


http_async_client = httpx.AsyncClient()


# Utility Functions
async def fetch_user_info_from_google(access_token: str):
    try:
        response = await http_async_client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

        response.raise_for_status()
        return response.json()
    except httpx.RequestError as e:
        logger.error(f"Error fetching user info: {e}")
        raise HTTPException(status_code=500, detail="Error contacting Google API")


async def get_tokens_from_code(code: str):
    try:
        response = await http_async_client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_CALLBACK_URL,
                "grant_type": "authorization_code",
            },
        )
        response.raise_for_status()
        return response.json()
    except httpx.RequestError as e:
        logger.error(f"Error fetching tokens: {e}")
        raise HTTPException(status_code=500, detail="Error contacting Google API")


async def get_user_from_db(user_email: str):
    try:
        return await users_collection.find_one({"email": user_email})
    except Exception as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Error accessing the database")


async def fetch_or_refresh_user_info(access_token: str, user_email: str):
    user_data = await get_user_from_db(user_email)
    if user_data:
        return user_data
    return await fetch_user_info_from_google(access_token)


@router.get("/login/google")
async def login_google():
    scopes = [
        "openid",
        "profile",
        "email",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.readonly",
    ]

    params = {
        "response_type": "code",
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_CALLBACK_URL,
        "scope": " ".join(scopes),
        "access_type": "offline",
    }

    auth_url = f"https://accounts.google.com/o/oauth2/auth?{urlencode(params)}"

    return RedirectResponse(url=auth_url)


@router.get("/google/callback")
async def callback(code: Annotated[str, "code"]):
    try:
        tokens = await get_tokens_from_code(code)

        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")

        if not access_token and not refresh_token:
            raise HTTPException(
                status_code=400, detail="Missing access or refresh token"
            )

        user_info = await fetch_user_info_from_google(access_token)
        user_email = user_info.get("email")
        user_name = user_info.get("name")
        user_picture = user_info.get("picture")

        if not user_email:
            raise HTTPException(status_code=400, detail="Email not found in user info")

        await store_user_info(name=user_name, email=user_email, picture=user_picture)

        response = RedirectResponse(
            url=f"{GOOGLE_REDIRECT_URI}?access_token={access_token}&refresh_token={refresh_token}"
        )

        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/me")
async def me(access_token: str = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        # Step 1: Verify the access token with Google's API
        user_info_response = requests.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if user_info_response.status_code != 200:
            # If the token is invalid or expired, handle that scenario
            raise HTTPException(
                status_code=401, detail="Invalid or expired access token"
            )

        # Step 2: Extract user data from Google
        user_info = user_info_response.json()
        user_email = user_info.get("email")

        if not user_email:
            raise HTTPException(status_code=400, detail="Email not found in user info")

        # Step 3: Check if the user exists in the database
        user_data = await users_collection.find_one({"email": user_email})

        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")

        # Return the user's information from the database
        return JSONResponse(
            content={
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data["picture"],
            }
        )

    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching user info from Google: {str(e)}")
        raise HTTPException(status_code=500, detail="Error contacting Google API")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/logout")
async def logout():
    response = JSONResponse(content={"detail": "Logged out successfully"})
    response.delete_cookie(key="access_token", samesite="none")
    response.delete_cookie(key="refresh_token", samesite="none")
    return response
