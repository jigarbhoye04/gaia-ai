import base64
from datetime import datetime
from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import BatchHttpRequest

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.utils.auth_utils import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

router = APIRouter()


def get_gmail_service(current_user: dict):
    creds = Credentials(
        token=current_user["access_token"],
        refresh_token=current_user.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
    )
    return build("gmail", "v1", credentials=creds)


def fetch_detailed_messages(service, messages):
    detailed_messages = []

    def callback(request_id, response, exception):
        if exception:
            print(f"Error in request {request_id}: {exception}")
        else:
            detailed_messages.append(response)

    batch = BatchHttpRequest(
        callback=callback, batch_uri="https://www.googleapis.com/batch/gmail/v1"
    )

    for msg in messages:
        req = service.users().messages().get(userId="me", id=msg["id"], format="full")
        batch.add(req)

    batch.execute()
    return detailed_messages


@router.get("/gmail/labels", summary="List Gmail Labels")
def list_labels(current_user: dict = Depends(get_current_user)):
    try:
        service = get_gmail_service(current_user)
        results = service.users().labels().list(userId="me").execute()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def decode_message_body(msg):
    """Decode the message body from a Gmail API message."""
    payload = msg.get("payload", {})
    parts = payload.get("parts", [])

    # Try to get plain text body
    for part in parts:
        if part.get("mimeType") == "text/plain":
            body = part.get("body", {}).get("data", "")
            return base64.urlsafe_b64decode(
                body.replace("-", "+").replace("_", "/")
            ).decode("utf-8", errors="ignore")

    # Fallback to main body if no plain text part
    if payload.get("body", {}).get("data"):
        body = payload["body"]["data"]
        return base64.urlsafe_b64decode(
            body.replace("-", "+").replace("_", "/")
        ).decode("utf-8", errors="ignore")

    return ""


def transform_gmail_message(msg) -> Dict:
    """Transform Gmail API message to frontend-friendly format while keeping all raw data for debugging."""
    headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}

    timestamp = int(msg.get("internalDate", 0)) / 1000
    time = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M")

    return {
        **msg,
        "id": msg.get("id", ""),
        "from": headers.get("From", ""),
        "subject": headers.get("Subject", ""),
        "time": time,
        "snippet": msg.get("snippet", ""),
        "body": decode_message_body(msg),
        # "raw": msg,
    }


@router.get("/gmail/messages")
def list_messages(
    max_results: int = 20,
    pageToken: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    try:
        service = get_gmail_service(current_user)

        # Prepare params for message list
        params = {"userId": "me", "labelIds": ["INBOX"], "maxResults": max_results}
        if pageToken:
            params["pageToken"] = pageToken

        # Fetch message list
        results = service.users().messages().list(**params).execute()
        messages = results.get("messages", [])

        # Use batching to fetch full details for each message
        detailed_messages = fetch_detailed_messages(service, messages)

        return {
            "messages": [transform_gmail_message(msg) for msg in detailed_messages],
            "nextPageToken": results.get("nextPageToken"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
