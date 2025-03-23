from typing import Annotated
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.config.loggers import auth_logger as logger
from app.config.settings import settings
from app.services.oauth_service import store_user_info
from app.tasks.mail_tasks import fetch_last_week_emails
from app.utils.oauth_utils import fetch_user_info_from_google, get_tokens_from_code

router = APIRouter()


http_async_client = httpx.AsyncClient()


@router.get("/login/google")
async def login_google():
    scopes = [
        "openid",
        "profile",
        "email",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/gmail.modify",
    ]
    params = {
        "response_type": "code",
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_CALLBACK_URL,
        "scope": " ".join(scopes),
        "access_type": "offline",
        "prompt": "consent",
    }
    auth_url = f"https://accounts.google.com/o/oauth2/auth?{urlencode(params)}"
    return RedirectResponse(url=auth_url)


@router.get("/google/callback", response_class=RedirectResponse)
async def callback(code: Annotated[str, "code"]) -> RedirectResponse:
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

        await store_user_info(user_name, user_email, user_picture)

        # Redirect URL can include tokens if needed
        redirect_url = f"{settings.GOOGLE_REDIRECT_URI}?access_token={access_token}&refresh_token={refresh_token}"
        response = RedirectResponse(url=redirect_url)

        # Set cookie expiration: access token (1 hour), refresh token (30 days)
        access_token_max_age = 3600  # seconds
        refresh_token_max_age = 30 * 24 * 3600  # 30 days in seconds

        env = settings.ENV
        if env == "production":
            production_domain = settings.FRONTEND_URL
            response.set_cookie(
                key="access_token",
                value=access_token,
                path="/",
                secure=True,  # HTTPS only
                httponly=True,
                samesite="None",
                domain=production_domain,
                max_age=access_token_max_age,
            )
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                path="/",
                secure=True,
                httponly=True,
                samesite="None",
                domain=production_domain,
                max_age=refresh_token_max_age,
            )
        else:
            response.set_cookie(
                key="access_token",
                value=access_token,
                path="/",
                samesite="lax",
                max_age=access_token_max_age,
            )
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                path="/",
                samesite="lax",
                max_age=refresh_token_max_age,
            )

        return response

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/me", response_model=dict)
async def get_me(
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
):
    """
    Returns the current authenticated user's details.
    Uses the dependency injection to fetch user data.
    """
    fetch_last_week_emails.delay(user)

    return {"message": "User retrieved successfully", **user}


# async def me(access_token: str = Cookie(None)):
# if not access_token:
#     raise HTTPException(status_code=401, detail="Authentication required")
# try:
#     # Validate the access token with Google's API
#     user_info_response = requests.get(
#         settings.GOOGLE_USERINFO_URL,
#         headers={"Authorization": f"Bearer {access_token}"},
#     )
#     if user_info_response.status_code != 200:
#         raise HTTPException(
#             status_code=401, detail="Invalid or expired access token"
#         )

#     user_info = user_info_response.json()
#     user_email = user_info.get("email")
#     if not user_email:
#         raise HTTPException(status_code=400, detail="Email not found in user info")

#     user_data = await users_collection.find_one({"email": user_email})
#     if not user_data:
#         raise HTTPException(status_code=404, detail="User not found")

#     return JSONResponse(
#         content={
#             "email": user_data["email"],
#             "name": user_data["name"],
#             "picture": user_data["picture"],
#         }
#     )

# except requests.exceptions.RequestException as e:
#     logger.error(f"Error fetching user info from Google: {str(e)}")
#     raise HTTPException(status_code=500, detail="Error contacting Google API")
# except Exception as e:
#     logger.error(f"Unexpected error: {str(e)}")
#     raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/logout")
async def logout():
    response = JSONResponse(content={"detail": "Logged out successfully"})
    env = settings.ENV

    if env == "production":
        production_domain = settings.FRONTEND_URL
        response.set_cookie(
            key="access_token",
            value="",
            expires=0,
            path="/",
            domain=production_domain,
            samesite="None",
            secure=True,
            httponly=True,
        )
        response.set_cookie(
            key="refresh_token",
            value="",
            expires=0,
            path="/",
            domain=production_domain,
            samesite="None",
            secure=True,
            httponly=True,
        )
    else:
        response.set_cookie(
            key="access_token", value="", expires=0, path="/", samesite="lax"
        )
        response.set_cookie(
            key="refresh_token", value="", expires=0, path="/", samesite="lax"
        )

    return response
