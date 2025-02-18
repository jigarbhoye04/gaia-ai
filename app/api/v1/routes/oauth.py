import requests
from fastapi import APIRouter, HTTPException, Cookie
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from app.services.oauth_service import store_user_info
import httpx
from app.db.collections import users_collection
from app.utils.logging_util import get_logger
from app.utils.auth_utils import (
    GOOGLE_USERINFO_URL,
    GOOGLE_TOKEN_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
)

router = APIRouter()
load_dotenv()

logger = get_logger(name="authentication", log_file="auth.log")


class OAuthRequest(BaseModel):
    code: str


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
                "redirect_uri": "postmessage",
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


# Routes
@router.post("/callback")
async def callback(oauth_request: OAuthRequest):
    try:
        tokens = await get_tokens_from_code(oauth_request.code)
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")

        if not access_token or not refresh_token:
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

        response = JSONResponse(
            content={
                "email": user_email,
                "name": user_name,
                "picture": user_picture,
            }
        )

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="none",
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="none",
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
