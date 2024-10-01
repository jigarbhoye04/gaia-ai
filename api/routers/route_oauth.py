import requests
from fastapi import APIRouter, Depends, HTTPException, Cookie
import requests  # Ensure this is the standard requests library
from fastapi import FastAPI, HTTPException, Response, Depends, Header
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import JSONResponse
import os

router = APIRouter()
load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
FRONTEND_URL = os.getenv("FRONTEND_URL")


class AccessToken(BaseModel):
    accessToken: str


def get_bearer_token(authorization: str = Header(None)):
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Invalid or missing token")
    return authorization.split(" ")[1]


@router.post('/oauth/callback')
async def callback(response: Response, token: str = Depends(get_bearer_token)):
    try:

        token_response = requests.post("https://oauth2.googleapis.com/token", data={
            "code": token,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            # "redirect_uri": REDIRECT_URI,
            "redirect_uri": 'postmessage',
            "grant_type": "authorization_code"
        })

        if token_response.status_code != 200:
            raise HTTPException(
                status_code=400, detail="Failed to obtain tokens")

        tokens = token_response.json()
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")

        # Fetch user info from Google
        user_info_response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo", headers={"Authorization": f"Bearer {access_token}"})

        # Check if the request was successful
        if user_info_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid access token")

        # Set the access token in an HTTP-only cookie

        user_info = user_info_response.json()  # Parse the response JSON
        user_email = user_info.get('email')  # Get the user email
        user_name = user_info.get('name')  # Get the user name
        user_picture = user_info.get('picture')  # Get the user picture

        response = JSONResponse(content={
            "email": user_email,
            "name": user_name,
            "picture": user_picture
        })

        response.set_cookie(
            key='access_token',
            value=access_token,
            httponly=True,  # Makes cookie inaccessible to JavaScript
            samesite='Lax',
            secure=True,
            # secure=True,  # Set to True in production for HTTPS
            # samesite='none'  # Adjust as necessary (Lax or Strict)
        )

        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            httponly=True,
            samesite='Lax',
            secure=True,
            # secure=True,
            # samesite='none',
        )
        return response

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/oauth/me')
async def me(access_token: str = Cookie(None), refresh_token: str = Cookie(None)):
    # Function to get user info from Google
    def get_user_info(token):
        user_info_response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token}"}
        )
        return user_info_response

    # Check if access token is present
    if access_token:
        user_info_response = get_user_info(access_token)

        if user_info_response.status_code == 200:
            user_info = user_info_response.json()
            return JSONResponse(content=user_info)
        elif user_info_response.status_code == 401:  # Unauthorized
            if refresh_token:
                # Try to refresh the access token using the refresh token
                refresh_response = requests.post("https://oauth2.googleapis.com/token", data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                })

                if refresh_response.status_code == 200:
                    tokens = refresh_response.json()
                    new_access_token = tokens.get("access_token")
                    new_refresh_token = tokens.get("refresh_token")

                    # Fetch user info with the new access token
                    user_info_response = get_user_info(new_access_token)

                    if user_info_response.status_code == 200:
                        user_info = user_info_response.json()
                        response = JSONResponse(content=user_info)

                        # Optionally, update cookies with new tokens
                        response.set_cookie(
                            key='access_token',
                            value=new_access_token,
                            httponly=True,
                            secure=True,
                            samesite='Lax'
                        )

                        if new_refresh_token:
                            response.set_cookie(
                                key='refresh_token',
                                value=new_refresh_token,
                                httponly=True,
                                secure=True,
                                samesite='Lax'
                            )
                        return response

                raise HTTPException(
                    status_code=400, detail="Unable to refresh access token")

    raise HTTPException(status_code=401, detail="Authentication required")


# @router.get("/oauth/google/callback")
# async def callback(code: str, response: Response):
#     # Exchange code for access token
#     async with httpx.AsyncClient() as client:
#         token_response = await client.post(
#             "https://oauth2.googleapis.com/token",
#             data={
#                 "code": code,
#                 "client_id": GOOGLE_CLIENT_ID,
#                 "client_secret": GOOGLE_CLIENT_SECRET,
#                 "redirect_uri": REDIRECT_URI,
#                 "grant_type": "authorization_code",
#             },
#         )

#         # Handle potential errors in the token response
#         if token_response.status_code != 200:
#             # Debugging line
#             print(f"Error getting token: {token_response.text}")
#             raise HTTPException(
#                 status_code=token_response.status_code, detail="Failed to obtain access token"
#             )

#         token_data = token_response.json()
#         access_token = token_data.get("access_token")
#         if not access_token:
#             raise HTTPException(
#                 status_code=400, detail="No access token returned"
#             )

#     print(access_token)
#     # Set the access token as an HTTP-only cookie
#     response.set_cookie(
#         key="access_token",
#         value=access_token,
#         # samesite="none",
#         # secure=True,
#         # httponly=True,
#         expires=datetime.now(timezone.utc) + timedelta(days=60)
#     )

#     # Redirect to the frontend
#     return RedirectResponse(url=f"{FRONTEND_URL}/try/chat")


# @router.get("/fetch_calendar_events")
# async def fetch_calendar_events(response: Response):
#     # Retrieve access token from cookie
#     access_token = response.cookies.get("access_token")
#     if not access_token:
#         raise HTTPException(status_code=401, detail="Access token is missing")

#     async with httpx.AsyncClient() as client:
#         events_response = await client.get(
#             "https://www.googleapis.com/calendar/v3/calendars/primary/events",
#             headers={"Authorization": f"Bearer {access_token}"},
#         )

#         # Handle potential errors in the events response
#         if events_response.status_code != 200:
#             print(f"Error fetching calendar events: {
#                   events_response.text}")  # Debugging line
#             raise HTTPException(
#                 status_code=events_response.status_code, detail="Failed to fetch calendar events"
#             )

#         events = events_response.json()
#     return events
