"""
Service module for handling authentication-related operations.
"""

from fastapi import HTTPException
import requests
from app.db.collections import users_collection
from app.utils.logging import get_logger
from app.utils.oauth_utils import (
    get_tokens_from_code,
    fetch_user_info_from_google,
)
from app.utils.auth_utils import GOOGLE_USERINFO_URL

logger = get_logger(name="auth_service", log_file="auth.log")


class AuthService:
    """
    Service class for handling OAuth callback processing and user retrieval.
    """

    def __init__(self):
        """
        Initialize the AuthService.
        """
        self.logger = logger

    async def process_callback(self, code: str) -> dict:
        """
        Process the OAuth callback by exchanging the authorization code for tokens,
        fetching user information from Google, and storing the user info.

        Args:
            code (str): The OAuth authorization code.

        Returns:
            dict: A dictionary containing the user's email, name, picture, and tokens.

        Raises:
            HTTPException: If required tokens or user info are missing.
        """
        tokens = await get_tokens_from_code(code)
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

        return {
            "email": user_email,
            "name": user_name,
            "picture": user_picture,
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    async def get_me(self, access_token: str) -> dict:
        """
        Retrieve the authenticated user's information by verifying the access token with Google
        and querying the local database.

        Args:
            access_token (str): The OAuth access token.

        Returns:
            dict: A dictionary containing the user's email, name, and picture.

        Raises:
            HTTPException: If the access token is invalid, expired, or the user is not found.
        """
        user_info_response = requests.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if user_info_response.status_code != 200:
            raise HTTPException(
                status_code=401, detail="Invalid or expired access token"
            )

        user_info = user_info_response.json()
        user_email = user_info.get("email")

        if not user_email:
            raise HTTPException(status_code=400, detail="Email not found in user info")

        user_data = await users_collection.find_one({"email": user_email})

        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data["picture"],
        }


async def store_user_info(name: str, email: str, picture: str):
    """
    Store or update user information in the database.

    Args:
        name (str): The user's name.
        email (str): The user's email.
        picture (str): URL of the user's profile picture.

    Returns:
        None
    """
    user_data = await users_collection.find_one({"email": email})
    if user_data:
        await users_collection.update_one(
            {"email": email}, {"$set": {"name": name, "picture": picture}}
        )
    else:
        await users_collection.insert_one(
            {"name": name, "email": email, "picture": picture}
        )
