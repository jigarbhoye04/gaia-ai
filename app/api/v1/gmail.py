import httpx
from fastapi import APIRouter, HTTPException, Cookie
from fastapi.responses import JSONResponse
import os

# Initialize router and load environment variables
router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")


# Helper function to refresh the access token
async def refresh_access_token(refresh_token: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
    return response


# Function to fetch emails using the access token
async def fetch_emails(access_token: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/gmail/v1/users/me/messages",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    return response


@router.get("/gmail/emails")
async def get_emails(
    access_token: str = Cookie(None), refresh_token: str = Cookie(None)
):
    if not access_token:
        raise HTTPException(status_code=401, detail="Access token required")

    # Try fetching emails with the access token
    response = await fetch_emails(access_token)

    if response.status_code == 200:
        return response.json()  # Return the list of emails directly

    if response.status_code == 401 and refresh_token:
        # Token expired, attempt to refresh
        refresh_response = await refresh_access_token(refresh_token)

        if refresh_response.status_code == 200:
            tokens = refresh_response.json()
            new_access_token = tokens.get("access_token")
            new_refresh_token = tokens.get("refresh_token")

            # Fetch emails with the new access token
            response = await fetch_emails(new_access_token)

            if response.status_code == 200:
                emails = response.json()

                # Set new access and refresh tokens in the cookies
                json_response = JSONResponse(content=emails)
                json_response.set_cookie(
                    key="access_token",
                    value=new_access_token,
                    httponly=True,
                    secure=True,
                    samesite="Lax",
                )
                json_response.set_cookie(
                    key="refresh_token",
                    value=new_refresh_token,
                    httponly=True,
                    secure=True,
                    samesite="Lax",
                )
                return json_response

        raise HTTPException(status_code=400, detail="Unable to refresh access token")

    raise HTTPException(
        status_code=400, detail="Failed to fetch emails or token expired"
    )
