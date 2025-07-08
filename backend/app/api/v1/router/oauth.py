from typing import Annotated, Optional
from urllib.parse import urlencode, urlparse

import httpx
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import JSONResponse, RedirectResponse

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.config.loggers import auth_logger as logger
from app.config.settings import settings
from app.models.user_models import (
    UserUpdateResponse,
    OnboardingRequest,
    OnboardingResponse,
    OnboardingPreferences,
)
from app.services.oauth_service import store_user_info
from app.services.user_service import update_user_profile
from app.services.onboarding_service import (
    complete_onboarding,
    get_user_onboarding_status,
    update_onboarding_preferences,
)

# from app.tasks.mail_tasks import fetch_last_week_emails
from app.utils.oauth_utils import fetch_user_info_from_google, get_tokens_from_code
from app.utils.watch_mail import watch_mail

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
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/drive.file",
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
async def callback(
    code: Annotated[str, "code"], background_tasks: BackgroundTasks
) -> RedirectResponse:
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

        user_id = await store_user_info(user_name, user_email, user_picture)

        # Redirect URL can include tokens if needed
        redirect_url = f"{settings.FRONTEND_URL}?access_token={access_token}&refresh_token={refresh_token}"
        response = RedirectResponse(url=redirect_url)

        # Set cookie expiration: access token (1 hour), refresh token (30 days)
        access_token_max_age = 3600  # seconds
        refresh_token_max_age = 30 * 24 * 3600  # 30 days in seconds

        env = settings.ENV
        if env == "production":
            parsed_frontend = urlparse(settings.FRONTEND_URL)
            production_domain = parsed_frontend.hostname
            response.set_cookie(
                key="access_token",
                value=access_token,
                path="/",
                secure=True,  # HTTPS only
                httponly=True,
                samesite="none",
                domain=production_domain,
                max_age=access_token_max_age,
            )
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                path="/",
                secure=True,
                httponly=True,
                samesite="none",
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

        # Add background task to register user to watch emails
        background_tasks.add_task(
            watch_mail,
            email=user_email,
            access_token=access_token,
            user_id=user_id,
            refresh_token=refresh_token,
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
    # fetch_last_week_emails.delay(user)

    # Get onboarding status
    onboarding_status = await get_user_onboarding_status(user["user_id"])

    return {
        "message": "User retrieved successfully",
        **user,
        "onboarding": onboarding_status,
    }


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


@router.patch("/me", response_model=UserUpdateResponse)
async def update_me(
    name: Optional[str] = Form(None),
    picture: Optional[UploadFile] = File(None),
    user: dict = Depends(get_current_user),
):
    """
    Update the current user's profile information.
    Supports updating name and profile picture.
    """
    user_id = user.get("user_id")

    if not user_id or not isinstance(user_id, str):
        raise HTTPException(status_code=400, detail="Invalid user ID")

    # Process profile picture if provided
    picture_data = None
    if picture and picture.size and picture.size > 0:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if picture.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}",
            )

        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if picture.size > max_size:
            raise HTTPException(
                status_code=400, detail="File size too large. Maximum size is 5MB"
            )

        picture_data = await picture.read()

    # Update user profile
    updated_user = await update_user_profile(
        user_id=user_id, name=name, picture_data=picture_data
    )

    return UserUpdateResponse(**updated_user)


@router.post("/onboarding", response_model=OnboardingResponse)
async def complete_user_onboarding(
    onboarding_data: OnboardingRequest, user: dict = Depends(get_current_user)
):
    """
    Complete user onboarding by storing preferences.
    This endpoint should be called when the user completes the onboarding flow.
    """
    try:
        updated_user = await complete_onboarding(user["user_id"], onboarding_data)

        return OnboardingResponse(
            success=True, message="Onboarding completed successfully", user=updated_user
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error completing onboarding: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to complete onboarding")


@router.get("/onboarding/status", response_model=dict)
async def get_onboarding_status(user: dict = Depends(get_current_user)):
    """
    Get the current user's onboarding status and preferences.
    """
    status = await get_user_onboarding_status(user["user_id"])
    return status


@router.patch("/onboarding/preferences", response_model=dict)
async def update_user_preferences(
    preferences: OnboardingPreferences, user: dict = Depends(get_current_user)
):
    """
    Update user's onboarding preferences.
    This can be used from the settings page to update preferences after onboarding.
    """
    try:
        updated_user = await update_onboarding_preferences(user["user_id"], preferences)

        return {
            "success": True,
            "message": "Preferences updated successfully",
            "user": updated_user,
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating preferences: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update preferences")


@router.patch("/name", response_model=UserUpdateResponse)
async def update_user_name(
    name: str = Form(...),
    user: dict = Depends(get_current_user),
):
    """
    Update the user's name. This is the consolidated endpoint for name updates.
    """
    try:
        user_id = user.get("user_id")
        updated_user = await update_user_profile(user_id=user_id, name=name)
        return UserUpdateResponse(**updated_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating user name: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update name")


@router.post("/logout")
async def logout():
    response = JSONResponse(content={"detail": "Logged out successfully"})
    env = settings.ENV

    if env == "production":
        parsed_frontend = urlparse(settings.FRONTEND_URL)
        production_domain = parsed_frontend.hostname
        response.set_cookie(
            key="access_token",
            value="",
            expires=0,
            path="/",
            domain=production_domain,
            samesite="none",
            secure=True,
            httponly=True,
        )
        response.set_cookie(
            key="refresh_token",
            value="",
            expires=0,
            path="/",
            domain=production_domain,
            samesite="none",
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
