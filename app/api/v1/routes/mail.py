import base64
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import BatchHttpRequest
from pydantic import BaseModel

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.config.settings import settings
from app.services.llm_service import do_prompt_no_stream
from app.utils.embedding_utils import search_notes_by_similarity

router = APIRouter()


def get_gmail_service(current_user: dict):
    creds = Credentials(
        token=current_user["access_token"],
        refresh_token=current_user.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
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


class EmailRequest(BaseModel):
    subject: str
    body: str
    prompt: str
    writingStyle: str


@router.post("/mail/ai/compose")
async def process_email(
    request: EmailRequest,
    current_user: dict = Depends(get_current_user),
) -> Any:
    try:
        print(current_user)

        notes = await search_notes_by_similarity(
            input_text=request.prompt, user_id=current_user.get("user_id")
        )

        prompt = f"""You are an expert professional email writer. Based on the details provided below, craft a well-structured, engaging, and professional email. Follow these instructions carefully:

        1. Analyze the provided email details.
        2. If the current subject is "empty", generate a compelling subject line that reflects the main purpose of the email.
        3. For the email body, include:
        - A courteous greeting.
        - A brief introduction.
        - A clear explanation or message that fulfills the specified task.
        - A professional closing with an appropriate sign-off.
        4. Maintain a tone that is formal, respectful, and tailored to the context, unless the task specifies otherwise.
        5. Do not include any additional commentary, headers, or titles outside of the email content.
        6. Use proper markdown to format the email where necessary, but do not use it excessively.
        7. Output your final response strictly in JSON format with the following structure:
        {{
            "subject": "Your generated subject line here",
            "body": "Your generated email body here"
        }}

        Email Details:
        - Current Subject: {request.subject or "empty"}
        - Body: {request.body or "empty"}
        - Writing Style: {request.writingStyle or "Professional"}

        Task:
        - {request.prompt}

        User Name: {current_user.get("name", "not specified")}

        System: The user has the following notes: "
        f"{"- ".join(notes)} (Fetched from the Database). Only mention these notes when relevant to the conversation

        Generate the email accordingly.
    """

        response = await do_prompt_no_stream(prompt)
        return {"result": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
