import base64
import os
import time
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

from fastapi import UploadFile
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import BatchHttpRequest

from app.config.settings import settings


def get_gmail_service(current_user: dict):
    creds = Credentials(
        token=current_user.get("access_token"),
        refresh_token=current_user.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
    )
    return build("gmail", "v1", credentials=creds)


def create_message(
    sender: str,
    to: List[str],
    subject: str,
    body: str,
    is_html: bool = False,
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None,
    attachments: Optional[List[UploadFile]] = None,
):
    """Create a message for an email with optional attachments.

    Args:
        sender: Email address of the sender.
        to: Email addresses of the recipients.
        subject: The subject of the email message.
        body: The body of the email message.
        is_html: Whether the body is HTML content.
        cc: Optional. Email addresses for cc recipients.
        bcc: Optional. Email addresses for bcc recipients.
        attachments: Optional. List of files to attach.

    Returns:
        An object containing a base64url encoded email message.
    """
    # Always create a MIME message regardless of attachments
    message = MIMEMultipart("alternative" if is_html else "mixed")
    message["from"] = sender
    message["to"] = ", ".join(to)
    message["subject"] = subject

    if cc:
        message["cc"] = ", ".join(cc)
    if bcc:
        message["bcc"] = ", ".join(bcc)

    # Add body with correct content type
    mime_type = "html" if is_html else "plain"
    message.attach(MIMEText(body, mime_type))

    # Add attachments if any
    if attachments and len(attachments) > 0:
        # If we have HTML content and attachments, convert to mixed if not already
        if is_html and message.get_content_subtype() != "mixed":
            mixed_message = MIMEMultipart("mixed")
            # Copy all headers
            for header, value in message.items():
                mixed_message[header] = value
            # Attach the original HTML part
            mixed_message.attach(message)
            message = mixed_message

        # Add each attachment
        for attachment in attachments:
            # content_type = (
            #     attachment.content_type
            #     or mimetypes.guess_type(attachment.filename)[0]
            #     or "application/octet-stream"
            # )

            attachment_part = MIMEApplication(
                attachment.file.read(), Name=os.path.basename(attachment.filename)
            )

            # Add header to attachment
            attachment_part["Content-Disposition"] = (
                f'attachment; filename="{os.path.basename(attachment.filename)}"'
            )
            message.attach(attachment_part)

            # Reset file pointer
            attachment.file.seek(0)

    # Encode the message properly as base64url
    encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    return {"raw": encoded_message}


def send_email(
    service, sender, to_list, subject, body, is_html, cc_list, bcc_list, attachments
):
    message = create_message(
        sender=sender,
        to=to_list,
        subject=subject,
        body=body,
        is_html=is_html,
        cc=cc_list,
        bcc=bcc_list,
        attachments=attachments,
    )
    sent_message = service.users().messages().send(userId="me", body=message).execute()
    return sent_message


def fetch_detailed_messages(service, messages, batch_size=20, delay=2):
    """
    Fetch detailed Gmail messages using batch requests while handling rate limits.

    :param service: Authenticated Gmail API service instance
    :param messages: List of message metadata (each containing 'id')
    :param batch_size: Number of messages per batch (default: 20)
    :param delay: Time in seconds to wait between batch executions
    :return: List of detailed message objects
    """
    detailed_messages = []

    def callback(request_id, response, exception):
        if exception:
            print(f"Error in request {request_id}: {exception}")
        else:
            detailed_messages.append(response)

    total_messages = len(messages)
    for i in range(0, total_messages, batch_size):
        batch = BatchHttpRequest(
            callback=callback, batch_uri="https://www.googleapis.com/batch/gmail/v1"
        )

        for msg in messages[i : i + batch_size]:
            req = (
                service.users().messages().get(userId="me", id=msg["id"], format="full")
            )
            batch.add(req)

        retries = 3
        for attempt in range(retries):
            try:
                batch.execute()
                break
            except HttpError as e:
                if e.resp.status == 429:
                    wait_time = (2**attempt) * delay
                    print(f"Rate limit hit. Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    print(f"Unexpected error: {e}")
                    break

        time.sleep(delay)

    return detailed_messages
