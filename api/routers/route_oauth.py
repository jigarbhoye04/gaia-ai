import requests
from fastapi import APIRouter, HTTPException, Cookie
from fastapi import Response
from dotenv import load_dotenv
from pydantic import BaseModel
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


class OAuthRequest(BaseModel):
    code: str


@router.post('/callback')
async def callback(response: Response, oauth_request: OAuthRequest):
    code = oauth_request.code
    try:

        print(code)
        token_response = requests.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": 'postmessage',
            "grant_type": "authorization_code"
        })

        if token_response.status_code != 200:
            raise HTTPException(
                status_code=400, detail="Failed to obtain tokens")

        tokens = token_response.json()
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")

        user_info_response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo", headers={"Authorization": f"Bearer {access_token}"})

        if user_info_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid access token")

        user_info = user_info_response.json()
        user_email = user_info.get('email')
        user_name = user_info.get('name')
        user_picture = user_info.get('picture')

        response = JSONResponse(content={
            "email": user_email,
            "name": user_name,
            "picture": user_picture,
            "access_token": access_token,
            "refresh_token": refresh_token
        })

        response.set_cookie(
            key='access_token',
            value=access_token,
            httponly=True,
            samesite='Lax',
            secure=True
        )

        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            httponly=True,
            samesite='Lax',
            secure=True
        )

        return response

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/me')
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


@router.get('/gmail/emails')
async def fetch_gmail_messages(access_token: str = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        # Fetch Gmail messages using the Gmail API
        gmail_url = "https://www.googleapis.com/gmail/v1/users/me/messages"
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(gmail_url, headers=headers)

        if response.status_code == 200:
            messages = response.json().get("messages", [])
            # Fetch details for each message (simplified example: just subject)
            message_details = []
            for message in messages:
                message_id = message['id']
                message_info_url = f"{gmail_url}/{message_id}"
                message_info_response = requests.get(
                    message_info_url, headers=headers)
                if message_info_response.status_code == 200:
                    msg_data = message_info_response.json()
                    # Extracting only the subject for simplicity
                    subject = next(
                        (header['value'] for header in msg_data['payload']
                         ['headers'] if header['name'] == 'Subject'),
                        "No Subject"
                    )
                    message_details.append(
                        {"id": message_id, "subject": subject})

            return JSONResponse(content={"messages": message_details})

        else:
            raise HTTPException(status_code=response.status_code,
                                detail="Failed to fetch Gmail messages")

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching Gmail messages: {str(e)}")

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
