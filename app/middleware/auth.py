from fastapi import HTTPException, Cookie
from app.db.connect import users_collection
import httpx
import logging
from app.utils.auth import GOOGLE_USERINFO_URL

logger = logging.getLogger(__name__)

# Reusable HTTP client
http_async_client = httpx.AsyncClient()


async def get_current_user(access_token: str = Cookie(None)):
    """
    Dependency to validate the user's authentication status and return the user ID.
    """
    if not access_token:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        # Step 1: Verify the access token with Google's API
        google_response = await http_async_client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if google_response.status_code != 200:
            logger.warning(f"Token verification failed: {google_response.text}")
            raise HTTPException(
                status_code=401, detail="Invalid or expired access token"
            )

        # Step 2: Extract user data from Google
        user_info = google_response.json()
        user_email = user_info.get("email")

        if not user_email:
            logger.error(f"Email not found in Google response: {user_info}")
            raise HTTPException(status_code=400, detail="Email not found in user info")

        # Step 3: Retrieve the user from the database
        user_data = await users_collection.find_one({"email": user_email})

        if not user_data:
            logger.warning(f"User with email {user_email} not found in the database")
            raise HTTPException(status_code=404, detail="User not found")

        # Optionally return more details if needed
        return str(user_data.get("_id"))

    except httpx.RequestError as e:
        logger.error(f"HTTP error during token verification: {e}")
        raise HTTPException(status_code=500, detail="Error contacting Google API")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
