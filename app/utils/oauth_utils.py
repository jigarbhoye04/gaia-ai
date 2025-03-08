import httpx
from fastapi import HTTPException

from app.config.loggers import auth_logger as logger
from app.config.settings import settings
from app.db.collections import users_collection

http_async_client = httpx.AsyncClient()


async def fetch_user_info_from_google(access_token: str):
    try:
        response = await http_async_client.get(
            settings.GOOGLE_USERINFO_URL,
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
            settings.GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_CALLBACK_URL,
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
