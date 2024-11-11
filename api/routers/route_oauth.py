import requests
from fastapi import APIRouter, HTTPException, Cookie
from fastapi import Response
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import os
import base64

router = APIRouter()
load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
FRONTEND_URL = os.getenv("FRONTEND_URL")


class OAuthRequest(BaseModel):
    code: str


@router.post("/callback")
async def callback(response: Response, oauth_request: OAuthRequest):
    code = oauth_request.code
    try:
        token_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": "postmessage",
                "grant_type": "authorization_code",
            },
        )

        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to obtain tokens")

        tokens = token_response.json()
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")

        user_info_response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if user_info_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid access token")

        user_info = user_info_response.json()
        user_email = user_info.get("email")
        user_name = user_info.get("name")
        user_picture = user_info.get("picture")

        response = JSONResponse(
            content={
                "email": user_email,
                "name": user_name,
                "picture": user_picture,
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
        )

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            samesite="lax",
            secure=True,
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            samesite="lax",
            secure=True,
        )

        return response

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me")
async def me(access_token: str = Cookie(None), refresh_token: str = Cookie(None)):
    # Function to get user info from Google

    def get_user_info(token):
        user_info_response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token}"},
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
                refresh_response = requests.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "client_id": GOOGLE_CLIENT_ID,
                        "client_secret": GOOGLE_CLIENT_SECRET,
                        "refresh_token": refresh_token,
                        "grant_type": "refresh_token",
                    },
                )

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
                            key="access_token",
                            value=new_access_token,
                            httponly=True,
                            secure=True,
                            samesite="lax",
                        )

                        if new_refresh_token:
                            response.set_cookie(
                                key="refresh_token",
                                value=new_refresh_token,
                                httponly=True,
                                secure=True,
                                samesite="lax",
                            )
                        return response

                raise HTTPException(
                    status_code=400, detail="Unable to refresh access token"
                )

    raise HTTPException(status_code=401, detail="Authentication required")


# async def me(access_token: str = Cookie(None), refresh_token: str = Cookie(None)):


@router.get("/gmail/emails")
async def fetch_gmail_messages(
    access_token: str = Cookie(None), refresh_token: str = Cookie(None)
):
    if not access_token:
        raise HTTPException(status_code=401, detail="Authentication required")

    def fetch_messages(token):
        gmail_url = "https://www.googleapis.com/gmail/v1/users/me/messages"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(gmail_url, headers=headers)
        return response

    def fetch_message_details(token, message_id):
        gmail_url = (
            f"https://www.googleapis.com/gmail/v1/users/me/messages/{message_id}"
        )
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(gmail_url, headers=headers)
        return response

    # First attempt to fetch messages
    response = fetch_messages(access_token)

    # If access token is expired, attempt refresh
    if response.status_code == 401 and refresh_token:
        # Request a new access token using the refresh token
        refresh_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )

        if refresh_response.status_code == 200:
            new_access_token = refresh_response.json().get("access_token")

            # Retry Gmail API call with new access token
            response = fetch_messages(new_access_token)

            if response.status_code == 200:
                # Fetch the details of the first 10 messages
                messages = response.json().get("messages", [])[:10]
                full_messages = []

                for message in messages:
                    message_id = message["id"]
                    message_details_response = fetch_message_details(
                        new_access_token, message_id
                    )
                    if message_details_response.status_code == 200:
                        full_messages.append(message_details_response.json())

                response_data = JSONResponse(content={"messages": full_messages})
                response_data.set_cookie(
                    key="access_token",
                    value=new_access_token,
                    httponly=True,
                    secure=True,
                    samesite="lax",
                )
                return response_data
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Failed to fetch Gmail messages with refreshed token",
                )

        else:
            raise HTTPException(
                status_code=400, detail="Failed to refresh access token"
            )

    elif response.status_code == 200:
        # Successfully fetched messages with the original access token
        # Fetch the details of the first 10 messages
        messages = response.json().get("messages", [])[:10]
        full_messages = []

        for message in messages:
            message_id = message["id"]
            message_details_response = fetch_message_details(access_token, message_id)
            if message_details_response.status_code == 200:
                full_messages.append(message_details_response.json())

        return JSONResponse(content={"messages": full_messages})

    raise HTTPException(
        status_code=response.status_code,
        detail="Failed to fetch Gmail messages",
    )


@router.get("/gmail/messages/search/{keyword}")
async def search_gmail_messages(
    keyword: str,  # The search keyword in the URL path
    access_token: str = Cookie(None),  # Access token from the user's cookies
    refresh_token: str = Cookie(None),  # Refresh token if access token has expired
):
    print(f"Searching for keyword: {keyword} in Gmail")

    if not access_token:
        raise HTTPException(status_code=401, detail="Authentication required")

    def search_messages(token, query):
        gmail_url = "https://www.googleapis.com/gmail/v1/users/me/messages"
        headers = {"Authorization": f"Bearer {token}"}
        params = {"q": query, "maxResults": 50}  # Limit to first 50 results
        response = requests.get(gmail_url, headers=headers, params=params)
        return response

    def fetch_message_details(token, message_id):
        gmail_url = (
            f"https://www.googleapis.com/gmail/v1/users/me/messages/{message_id}"
        )
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(gmail_url, headers=headers)
        return response

    def extract_relevant_details(message_details):
        headers = message_details.get("payload", {}).get("headers", [])
        subject = None
        sender = None
        recipient = None
        body = None

        # Extract subject, from, to, and body
        for header in headers:
            if header["name"] == "Subject":
                subject = header.get("value")
            elif header["name"] == "From":
                sender = header.get("value")
            elif header["name"] == "To":
                recipient = header.get("value")

        # Extract body (if it's a simple text body)
        if "payload" in message_details:
            parts = message_details["payload"].get("parts", [])
            for part in parts:
                if part["mimeType"] == "text/plain":
                    body = part.get("body", {}).get("data")
                    if body:
                        body = base64.urlsafe_b64decode(body).decode("utf-8")

        return {"subject": subject, "from": sender, "to": recipient, "body": body}

    # First attempt to search for messages with the provided keyword
    response = search_messages(access_token, keyword)

    # If access token is expired, attempt to refresh
    if response.status_code == 401 and refresh_token:
        # Request a new access token using the refresh token
        refresh_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )

        if refresh_response.status_code == 200:
            new_access_token = refresh_response.json().get("access_token")

            # Retry Gmail search with new access token
            response = search_messages(new_access_token, keyword)

            if response.status_code == 200:
                # Fetch details of the first 50 matching messages
                messages = response.json().get("messages", [])[:50]
                full_messages = []

                for message in messages:
                    message_id = message["id"]
                    message_details_response = fetch_message_details(
                        new_access_token, message_id
                    )
                    if message_details_response.status_code == 200:
                        message_details = message_details_response.json()
                        relevant_details = extract_relevant_details(message_details)
                        full_messages.append(relevant_details)

                response_data = JSONResponse(content={"messages": full_messages})
                response_data.set_cookie(
                    key="access_token",
                    value=new_access_token,
                    httponly=True,
                    secure=True,
                    samesite="lax",
                )
                return response_data
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Failed to search Gmail messages with refreshed token",
                )

        else:
            raise HTTPException(
                status_code=400, detail="Failed to refresh access token"
            )

    elif response.status_code == 200:
        # Successfully fetched search results
        # Fetch details of the first 50 matching messages
        messages = response.json().get("messages", [])[:50]
        full_messages = []

        for message in messages:
            message_id = message["id"]
            message_details_response = fetch_message_details(access_token, message_id)
            if message_details_response.status_code == 200:
                message_details = message_details_response.json()
                relevant_details = extract_relevant_details(message_details)
                full_messages.append(relevant_details)

        return JSONResponse(content={"messages": full_messages})

    raise HTTPException(
        status_code=response.status_code,
        detail="Failed to search Gmail messages",
    )
