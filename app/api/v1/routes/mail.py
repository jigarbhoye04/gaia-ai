import base64
from datetime import datetime
from typing import Any, Dict, Optional, List
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import os
import mimetypes

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import BatchHttpRequest
from pydantic import BaseModel, EmailStr

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


class SendEmailRequest(BaseModel):
    to: List[EmailStr]
    subject: str
    body: str
    cc: Optional[List[EmailStr]] = None
    bcc: Optional[List[EmailStr]] = None
    
def create_message(sender: str, to: List[str], subject: str, body: str, cc: Optional[List[str]] = None, bcc: Optional[List[str]] = None, attachments: Optional[List[UploadFile]] = None):
    """Create a message for an email with optional attachments.

    Args:
        sender: Email address of the sender.
        to: Email addresses of the recipients.
        subject: The subject of the email message.
        body: The body of the email message.
        cc: Optional. Email addresses for cc recipients.
        bcc: Optional. Email addresses for bcc recipients.
        attachments: Optional. List of files to attach.

    Returns:
        An object containing a base64url encoded email message.
    """
    if attachments and len(attachments) > 0:
        # Create multipart message
        message = MIMEMultipart()
        message['from'] = sender
        message['to'] = ', '.join(to)
        message['subject'] = subject
        
        if cc:
            message['cc'] = ', '.join(cc)
        if bcc:
            message['bcc'] = ', '.join(bcc)
            
        # Add body
        message.attach(MIMEText(body))
        
        # Add attachments
        for attachment in attachments:
            content_type = attachment.content_type or mimetypes.guess_type(attachment.filename)[0] or 'application/octet-stream'
            
            attachment_part = MIMEApplication(
                attachment.file.read(),
                Name=os.path.basename(attachment.filename)
            )
            
            # Add header to attachment
            attachment_part['Content-Disposition'] = f'attachment; filename="{os.path.basename(attachment.filename)}"'
            message.attach(attachment_part)
            
        # Reset file pointers
        for attachment in attachments:
            attachment.file.seek(0)
            
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    else:
        # Simple message without attachments
        message_parts = [
            f"From: {sender}",
            f"To: {', '.join(to)}"
        ]
        
        # Add CC if present
        if cc:
            message_parts.append(f"Cc: {', '.join(cc)}")
            
        # Add BCC if present
        if bcc:
            message_parts.append(f"Bcc: {', '.join(bcc)}")
            
        # Add subject and body
        message_parts.append(f"Subject: {subject}")
        message_parts.append("")  # Empty line between headers and body
        message_parts.append(body)
        
        # Join all parts with newlines
        message_str = "\n".join(message_parts)
        encoded_message = base64.urlsafe_b64encode(message_str.encode()).decode()
    
    return {'raw': encoded_message}

@router.post("/gmail/send", summary="Send an email using Gmail API")
async def send_email(
    to: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    cc: Optional[str] = Form(None),
    bcc: Optional[str] = Form(None),
    attachments: Optional[List[UploadFile]] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Send an email using the Gmail API.
    
    - **to**: Recipient email addresses (comma-separated)
    - **subject**: Email subject
    - **body**: Email body
    - **cc**: Optional CC recipients (comma-separated)
    - **bcc**: Optional BCC recipients (comma-separated)
    - **attachments**: Optional files to attach to the email
    """
    try:
        service = get_gmail_service(current_user)
        
        # Get the user's email address
        profile = service.users().getProfile(userId='me').execute()
        sender = profile.get('emailAddress')
        
        # Parse recipients
        to_list = [email.strip() for email in to.split(',') if email.strip()]
        cc_list = [email.strip() for email in cc.split(',')] if cc else None
        bcc_list = [email.strip() for email in bcc.split(',')] if bcc else None
        
        # Create the email message
        message = create_message(
            sender=sender,
            to=to_list,
            subject=subject,
            body=body,
            cc=cc_list,
            bcc=bcc_list,
            attachments=attachments
        )
        
        # Send the email
        sent_message = service.users().messages().send(
            userId='me',
            body=message
        ).execute()
        
        return {
            "message_id": sent_message.get('id'),
            "status": "Email sent successfully",
            "attachments_count": len(attachments) if attachments else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.post("/gmail/send-json", summary="Send an email using JSON payload")
async def send_email_json(
    request: SendEmailRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send an email using the Gmail API with JSON payload (no attachments).
    
    - **to**: List of recipient email addresses
    - **subject**: Email subject
    - **body**: Email body
    - **cc**: Optional list of CC recipients
    - **bcc**: Optional list of BCC recipients
    """
    try:
        service = get_gmail_service(current_user)
        
        # Get the user's email address
        profile = service.users().getProfile(userId='me').execute()
        sender = profile.get('emailAddress')
        
        # Create the email message
        message = create_message(
            sender=sender,
            to=request.to,
            subject=request.subject,
            body=request.body,
            cc=request.cc,
            bcc=request.bcc
        )
        
        # Send the email
        sent_message = service.users().messages().send(
            userId='me',
            body=message
        ).execute()
        
        return {
            "message_id": sent_message.get('id'),
            "status": "Email sent successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


class EmailSummaryRequest(BaseModel):
    message_id: str
    include_key_points: bool = True
    include_action_items: bool = True
    max_length: Optional[int] = 150


@router.post("/gmail/summarize", summary="Summarize an email using LLM")
async def summarize_email(
    request: EmailSummaryRequest,
    current_user: dict = Depends(get_current_user),
) -> Any:
    """
    Summarize an email using the LLM service.
    
    - **message_id**: The Gmail message ID to summarize
    - **include_key_points**: Whether to include key points in the summary
    - **include_action_items**: Whether to include action items in the summary
    - **max_length**: Maximum length of the summary in words
    
    Returns a summary of the email with optional key points and action items.
    """
    try:
        service = get_gmail_service(current_user)
        
        # Fetch the email by ID
        message = service.users().messages().get(
            userId='me', 
            id=request.message_id,
            format='full'
        ).execute()
        
        # Transform the message into a readable format
        email_data = transform_gmail_message(message)
        
        # Prepare the prompt for the LLM
        prompt = f"""You are an expert email assistant. Please summarize the following email concisely and professionally.

Email Subject: {email_data.get('subject', 'No Subject')}
From: {email_data.get('from', 'Unknown')}
Date: {email_data.get('time', 'Unknown')}

Email Content:
{email_data.get('body', email_data.get('snippet', 'No content available'))}

Please provide a summary of this email in {request.max_length or 150} words or less.

{" Include the key points of the email." if request.include_key_points else ""}
{" Identify any action items or requests made in the email." if request.include_action_items else ""}

Format your response as a JSON object with the following structure:
{{
    "summary": "The concise summary of the email",
    "key_points": ["Key point 1", "Key point 2", ...],
    "action_items": ["Action item 1", "Action item 2", ...],
    "sentiment": "A brief description of the email's tone/sentiment (formal, urgent, friendly, etc.)"
}}
"""
        
        # Call the LLM service to generate the summary
        llm_response = await do_prompt_no_stream(prompt)
        
        return {
            "email_id": request.message_id,
            "email_subject": email_data.get('subject', 'No Subject'),
            "result": llm_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to summarize email: {str(e)}")
