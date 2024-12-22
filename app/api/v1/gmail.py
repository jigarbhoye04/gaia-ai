import httpx
from fastapi import APIRouter, HTTPException, Cookie
from fastapi.responses import JSONResponse
from app.utils.auth import (
    GOOGLE_TOKEN_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
)

# Initialize router and load environment variables
router = APIRouter()


http_async_client = httpx.AsyncClient()


# Helper function to refresh the access token
async def refresh_access_token(refresh_token: str):
    response = await http_async_client.post(
        GOOGLE_TOKEN_URL,
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
    response = await http_async_client.get(
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


# @router.get("/gmail/emails")
# async def fetch_gmail_messages(
#     access_token: str = Cookie(None), refresh_token: str = Cookie(None)
# ):
#     if not access_token:
#         raise HTTPException(status_code=401, detail="Authentication required")

#     def fetch_messages(token):
#         gmail_url = "https://www.googleapis.com/gmail/v1/users/me/messages"
#         headers = {"Authorization": f"Bearer {token}"}
#         response = requests.get(gmail_url, headers=headers)
#         return response

#     def fetch_message_details(token, message_id):
#         gmail_url = (
#             f"https://www.googleapis.com/gmail/v1/users/me/messages/{message_id}"
#         )
#         headers = {"Authorization": f"Bearer {token}"}
#         response = requests.get(gmail_url, headers=headers)
#         return response

#     # First attempt to fetch messages
#     response = fetch_messages(access_token)

#     # If access token is expired, attempt refresh
#     if response.status_code == 401 and refresh_token:
#         # Request a new access token using the refresh token
#         refresh_response = requests.post(
#             "https://oauth2.googleapis.com/token",
#             data={
#                 "client_id": GOOGLE_CLIENT_ID,
#                 "client_secret": GOOGLE_CLIENT_SECRET,
#                 "refresh_token": refresh_token,
#                 "grant_type": "refresh_token",
#             },
#         )

#         if refresh_response.status_code == 200:
#             new_access_token = refresh_response.json().get("access_token")

#             # Retry Gmail API call with new access token
#             response = fetch_messages(new_access_token)

#             if response.status_code == 200:
#                 # Fetch the details of the first 10 messages
#                 messages = response.json().get("messages", [])[:10]
#                 full_messages = []

#                 for message in messages:
#                     message_id = message["id"]
#                     message_details_response = fetch_message_details(
#                         new_access_token, message_id
#                     )
#                     if message_details_response.status_code == 200:
#                         full_messages.append(message_details_response.json())

#                 response_data = JSONResponse(content={"messages": full_messages})
#                 response_data.set_cookie(
#                     key="access_token",
#                     value=new_access_token,
#                     httponly=True,
#                     secure=True,
#                     samesite="lax",
#                 )
#                 return response_data
#             else:
#                 raise HTTPException(
#                     status_code=400,
#                     detail="Failed to fetch Gmail messages with refreshed token",
#                 )

#         else:
#             raise HTTPException(
#                 status_code=400, detail="Failed to refresh access token"
#             )

#     elif response.status_code == 200:
#         # Successfully fetched messages with the original access token
#         # Fetch the details of the first 10 messages
#         messages = response.json().get("messages", [])[:10]
#         full_messages = []

#         for message in messages:
#             message_id = message["id"]
#             message_details_response = fetch_message_details(access_token, message_id)
#             if message_details_response.status_code == 200:
#                 full_messages.append(message_details_response.json())

#         return JSONResponse(content={"messages": full_messages})

#     raise HTTPException(
#         status_code=response.status_code,
#         detail="Failed to fetch Gmail messages",
#     )


# @router.get("/gmail/messages/search/{keyword}")
# async def search_gmail_messages(
#     keyword: str,  # The search keyword in the URL path
#     access_token: str = Cookie(None),  # Access token from the user's cookies
#     refresh_token: str = Cookie(None),  # Refresh token if access token has expired
# ):
#     print(f"Searching for keyword: {keyword} in Gmail")

#     if not access_token:
#         raise HTTPException(status_code=401, detail="Authentication required")

#     def search_messages(token, query):
#         gmail_url = "https://www.googleapis.com/gmail/v1/users/me/messages"
#         headers = {"Authorization": f"Bearer {token}"}
#         params = {"q": query, "maxResults": 50}  # Limit to first 50 results
#         response = requests.get(gmail_url, headers=headers, params=params)
#         return response

#     def fetch_message_details(token, message_id):
#         gmail_url = (
#             f"https://www.googleapis.com/gmail/v1/users/me/messages/{message_id}"
#         )
#         headers = {"Authorization": f"Bearer {token}"}
#         response = requests.get(gmail_url, headers=headers)
#         return response

#     def extract_relevant_details(message_details):
#         headers = message_details.get("payload", {}).get("headers", [])
#         subject = None
#         sender = None
#         recipient = None
#         body = None

#         # Extract subject, from, to, and body
#         for header in headers:
#             if header["name"] == "Subject":
#                 subject = header.get("value")
#             elif header["name"] == "From":
#                 sender = header.get("value")
#             elif header["name"] == "To":
#                 recipient = header.get("value")

#         # Extract body (if it's a simple text body)
#         if "payload" in message_details:
#             parts = message_details["payload"].get("parts", [])
#             for part in parts:
#                 if part["mimeType"] == "text/plain":
#                     body = part.get("body", {}).get("data")
#                     if body:
#                         body = base64.urlsafe_b64decode(body).decode("utf-8")

#         return {"subject": subject, "from": sender, "to": recipient, "body": body}

#     # First attempt to search for messages with the provided keyword
#     response = search_messages(access_token, keyword)

#     # If access token is expired, attempt to refresh
#     if response.status_code == 401 and refresh_token:
#         # Request a new access token using the refresh token
#         refresh_response = requests.post(
#             "https://oauth2.googleapis.com/token",
#             data={
#                 "client_id": GOOGLE_CLIENT_ID,
#                 "client_secret": GOOGLE_CLIENT_SECRET,
#                 "refresh_token": refresh_token,
#                 "grant_type": "refresh_token",
#             },
#         )

#         if refresh_response.status_code == 200:
#             new_access_token = refresh_response.json().get("access_token")

#             # Retry Gmail search with new access token
#             response = search_messages(new_access_token, keyword)

#             if response.status_code == 200:
#                 # Fetch details of the first 50 matching messages
#                 messages = response.json().get("messages", [])[:50]
#                 full_messages = []

#                 for message in messages:
#                     message_id = message["id"]
#                     message_details_response = fetch_message_details(
#                         new_access_token, message_id
#                     )
#                     if message_details_response.status_code == 200:
#                         message_details = message_details_response.json()
#                         relevant_details = extract_relevant_details(message_details)
#                         full_messages.append(relevant_details)

#                 response_data = JSONResponse(content={"messages": full_messages})
#                 response_data.set_cookie(
#                     key="access_token",
#                     value=new_access_token,
#                     httponly=True,
#                     secure=True,
#                     samesite="lax",
#                 )
#                 return response_data
#             else:
#                 raise HTTPException(
#                     status_code=400,
#                     detail="Failed to search Gmail messages with refreshed token",
#                 )

#         else:
#             raise HTTPException(
#                 status_code=400, detail="Failed to refresh access token"
#             )

#     elif response.status_code == 200:
#         # Successfully fetched search results
#         # Fetch details of the first 50 matching messages
#         messages = response.json().get("messages", [])[:50]
#         full_messages = []

#         for message in messages:
#             message_id = message["id"]
#             message_details_response = fetch_message_details(access_token, message_id)
#             if message_details_response.status_code == 200:
#                 message_details = message_details_response.json()
#                 relevant_details = extract_relevant_details(message_details)
#                 full_messages.append(relevant_details)

#         return JSONResponse(content={"messages": full_messages})

#     raise HTTPException(
#         status_code=response.status_code,
#         detail="Failed to search Gmail messages",
#     )
