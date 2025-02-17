# # import requests
# # from fastapi import APIRouter, HTTPException, Cookie
# # from dotenv import load_dotenv
# # from pydantic import BaseModel
# # from fastapi.responses import JSONResponse
# # from app.services.auth_service import store_user_info
# # import httpx
# # from app.db.collections import users_collection
# # from app.utils.logging_util import get_logger
# # from app.utils.auth_utils import (
# #     GOOGLE_USERINFO_URL,
# #     GOOGLE_TOKEN_URL,
# #     GOOGLE_CLIENT_ID,
# #     GOOGLE_CLIENT_SECRET,
# # )

# # router = APIRouter()
# # load_dotenv()

# # logger = get_logger(name="authentication", log_file="auth.log")


# # class OAuthRequest(BaseModel):
# #     code: str


# # http_async_client = httpx.AsyncClient()


# # # Utility Functions
# # async def fetch_user_info_from_google(access_token: str):
# #     try:
# #         response = await http_async_client.get(
# #             GOOGLE_USERINFO_URL,
# #             headers={"Authorization": f"Bearer {access_token}"},
# #         )

# #         response.raise_for_status()
# #         return response.json()
# #     except httpx.RequestError as e:
# #         logger.error(f"Error fetching user info: {e}")
# #         raise HTTPException(status_code=500, detail="Error contacting Google API")


# # async def get_tokens_from_code(code: str):
# #     try:
# #         response = await http_async_client.post(
# #             GOOGLE_TOKEN_URL,
# #             data={
# #                 "code": code,
# #                 "client_id": GOOGLE_CLIENT_ID,
# #                 "client_secret": GOOGLE_CLIENT_SECRET,
# #                 "redirect_uri": "postmessage",
# #                 "grant_type": "authorization_code",
# #             },
# #         )
# #         response.raise_for_status()
# #         return response.json()
# #     except httpx.RequestError as e:
# #         logger.error(f"Error fetching tokens: {e}")
# #         raise HTTPException(status_code=500, detail="Error contacting Google API")


# # async def get_user_from_db(user_email: str):
# #     try:
# #         return await users_collection.find_one({"email": user_email})
# #     except Exception as e:
# #         logger.error(f"Database error: {e}")
# #         raise HTTPException(status_code=500, detail="Error accessing the database")


# # async def fetch_or_refresh_user_info(access_token: str, user_email: str):
# #     user_data = await get_user_from_db(user_email)
# #     if user_data:
# #         return user_data
# #     return await fetch_user_info_from_google(access_token)


# # # Routes
# # @router.post("/callback")
# # async def callback(oauth_request: OAuthRequest):
# #     try:
# #         tokens = await get_tokens_from_code(oauth_request.code)
# #         access_token = tokens.get("access_token")
# #         refresh_token = tokens.get("refresh_token")

# #         if not access_token or not refresh_token:
# #             raise HTTPException(
# #                 status_code=400, detail="Missing access or refresh token"
# #             )

# #         user_info = await fetch_user_info_from_google(access_token)
# #         user_email = user_info.get("email")
# #         user_name = user_info.get("name")
# #         user_picture = user_info.get("picture")

# #         if not user_email:
# #             raise HTTPException(status_code=400, detail="Email not found in user info")

# #         await store_user_info(name=user_name, email=user_email, picture=user_picture)

# #         response = JSONResponse(
# #             content={
# #                 "email": user_email,
# #                 "name": user_name,
# #                 "picture": user_picture,
# #             }
# #         )

# #         response.set_cookie(
# #             key="access_token",
# #             value=access_token,
# #             httponly=True,
# #             secure=True,
# #             samesite="none",
# #         )
# #         response.set_cookie(
# #             key="refresh_token",
# #             value=refresh_token,
# #             httponly=True,
# #             secure=True,
# #             samesite="none",
# #         )

# #         return response
# #     except HTTPException as e:
# #         raise e
# #     except Exception as e:
# #         logger.error(f"Unexpected error: {e}")
# #         raise HTTPException(status_code=500, detail=f"Internal server error: {e}")


# # @router.get("/me")
# # async def me(access_token: str = Cookie(None)):
# #     if not access_token:
# #         raise HTTPException(status_code=401, detail="Authentication required")

# #     try:
# #         # Step 1: Verify the access token with Google's API
# #         user_info_response = requests.get(
# #             GOOGLE_USERINFO_URL,
# #             headers={"Authorization": f"Bearer {access_token}"},
# #         )

# #         if user_info_response.status_code != 200:
# #             # If the token is invalid or expired, handle that scenario
# #             raise HTTPException(
# #                 status_code=401, detail="Invalid or expired access token"
# #             )

# #         # Step 2: Extract user data from Google
# #         user_info = user_info_response.json()
# #         user_email = user_info.get("email")

# #         if not user_email:
# #             raise HTTPException(status_code=400, detail="Email not found in user info")

# #         # Step 3: Check if the user exists in the database
# #         user_data = await users_collection.find_one({"email": user_email})

# #         if not user_data:
# #             raise HTTPException(status_code=404, detail="User not found")

# #         # Return the user's information from the database
# #         return JSONResponse(
# #             content={
# #                 "email": user_data["email"],
# #                 "name": user_data["name"],
# #                 "picture": user_data["picture"],
# #             }
# #         )

# #     except requests.exceptions.RequestException as e:
# #         logger.error(f"Error fetching user info from Google: {str(e)}")
# #         raise HTTPException(status_code=500, detail="Error contacting Google API")
# #     except Exception as e:
# #         logger.error(f"Unexpected error: {str(e)}")
# #         raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

# from fastapi import APIRouter, Depends, HTTPException, Response, status, Cookie
# from pydantic import BaseModel
# from pymongo.collection import Collection

# from app.services.oauth_service import (
#     google_authenticate,
#     create_tokens,
#     verify_refresh_token,
# )
# from app.api.v1.dependencies.oauth_dependencies import get_current_user, get_users_collection

# router = APIRouter()


# class GoogleLoginPayload(BaseModel):
#     credential: str
#     clientId: str
#     select_by: str


# @router.post("/google")
# async def google_login(
#     payload: GoogleLoginPayload,
#     response: Response,
#     users_collection: Collection = Depends(get_users_collection),
# ):
#     """
#     Receives the Google login response, verifies the Google JWT,
#     creates (or finds) a user in MongoDB, and returns signed access and refresh tokens via cookies.
#     """
#     try:
#         # Verify Google token and extract user info
#         user_data = google_authenticate(payload.credential)
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid Google token {e}"
#         )

#     # Find user by email or create new user
#     user = await users_collection.find_one({"email": user_data["email"]})
#     if not user:
#         # You can customize the user document as needed
#         await users_collection.insert_one(user_data)

#     tokens = create_tokens(user_data)

#     # Set HttpOnly cookies for access and refresh tokens
#     response.set_cookie(
#         key="access_token",
#         value=tokens["access_token"],
#         httponly=True,
#         secure=True,
#         samesite="lax",
#         max_age=15 * 60,  # e.g. 15 minutes expiry for access token
#     )
#     response.set_cookie(
#         key="refresh_token",
#         value=tokens["refresh_token"],
#         httponly=True,
#         secure=True,
#         samesite="lax",
#         max_age=30 * 24 * 60 * 60,  # e.g. 30 days expiry for refresh token
#     )

#     return {"msg": "Login successful", "user": user_data}


# @router.post("/refresh")
# async def refresh_token(response: Response, refresh_token: str = Cookie(None)):
#     """
#     Uses the refresh token stored in the cookie to generate a new access token.
#     """
#     if not refresh_token:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing"
#         )

#     try:
#         user_data = verify_refresh_token(refresh_token)
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail=f"Invalid refresh token: {e}",
#         )

#     # Create a new access token (you could also choose to create a new refresh token if desired)
#     new_access_token = create_tokens(user_data)["access_token"]

#     response.set_cookie(
#         key="access_token",
#         value=new_access_token,
#         httponly=True,
#         secure=True,
#         samesite="lax",
#         max_age=15 * 60,
#     )
#     return {"msg": "Access token refreshed"}


# @router.get("/me")
# async def get_me(current_user: dict = Depends(get_current_user)):
#     """
#     Returns the authenticated user's information.
#     """
#     return current_user


from fastapi import APIRouter, Depends, HTTPException, Response, status, Cookie
from pydantic import BaseModel
from pymongo.collection import Collection
import logging

from app.services.oauth_service import (
    google_authenticate,
    create_tokens,
    create_access_token,
    verify_refresh_token,
)
from app.api.v1.dependencies.oauth_dependencies import (
    get_users_collection,
    get_current_user,
)

logger = logging.getLogger("oauth_routes")

router = APIRouter()


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
    else:
        # Optionally merge or update user details here.
        user_data = {**user, **user_data}

    tokens = create_tokens(user_data)

    # Set HttpOnly cookies for tokens with proper security flags.
    response.set_cookie(
        key="access_token",
        value=tokens["access_token"],
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=15 * 60,  # 15 minutes
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=True,
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
