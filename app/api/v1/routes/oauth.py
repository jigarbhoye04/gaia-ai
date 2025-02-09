"""
Router module for authentication endpoints.
"""

from fastapi import APIRouter, HTTPException, Cookie, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import requests
from app.services.auth_service import AuthService

router = APIRouter()
load_dotenv()
auth_service = AuthService()


class OAuthRequest(BaseModel):
    """
    Pydantic model for OAuth callback requests.
    """

    code: str


@router.post("/callback")
async def callback(response: Response, oauth_request: OAuthRequest):
    """
    OAuth callback endpoint that exchanges an authorization code for tokens,
    fetches user info from Google, stores the user info, and sets authentication cookies.

    Args:
        response (Response): FastAPI response object for setting cookies.
        oauth_request (OAuthRequest): The request body containing the OAuth code.

    Returns:
        JSONResponse: A JSON response containing the user's email, name, and picture.
    """
    try:
        result = await auth_service.process_callback(oauth_request.code)
        access_token = result.get("access_token")
        refresh_token = result.get("refresh_token")
        response_json = JSONResponse(
            content={
                "email": result["email"],
                "name": result["name"],
                "picture": result["picture"],
            }
        )
        response_json.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="none",
        )
        response_json.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="none",
        )
        return response_json
    except HTTPException as e:
        raise e
    except Exception as e:
        auth_service.logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/me")
async def me(access_token: str = Cookie(None)):
    """
    Endpoint to retrieve the authenticated user's information based on the access token.

    Args:
        access_token (str, optional): The access token passed in as a cookie. Defaults to None.

    Returns:
        JSONResponse: A JSON response containing the user's email, name, and profile picture.
    """
    if not access_token:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        user_data = await auth_service.get_me(access_token)
        return JSONResponse(
            content={
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data["picture"],
            }
        )
    except requests.exceptions.RequestException as e:
        auth_service.logger.error(f"Error fetching user info from Google: {str(e)}")
        raise HTTPException(status_code=500, detail="Error contacting Google API")
    except Exception as e:
        auth_service.logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
