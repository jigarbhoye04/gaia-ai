import base64
import os
import time
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional, Dict, Any

from fastapi import UploadFile
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import BatchHttpRequest

from app.config.settings import settings
from app.config.loggers import general_logger as logger


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


def modify_message_labels(
    service,
    message_ids: List[str],
    add_labels: List[str] = None,
    remove_labels: List[str] = None,
) -> List[Dict[str, Any]]:
    """
    Modify the labels of Gmail messages.

    Args:
        service: Gmail API service instance
        message_ids: List of message IDs to modify
        add_labels: Labels to add to the messages
        remove_labels: Labels to remove from the messages

    Returns:
        List of modified messages
    """
    if not add_labels and not remove_labels:
        return []

    add_labels = add_labels or []
    remove_labels = remove_labels or []

    batch = service.new_batch_http_request()

    def callback(request_id, response, exception):
        if exception:
            print(f"Error modifying message {request_id}: {exception}")

    for message_id in message_ids:
        batch.add(
            service.users()
            .messages()
            .modify(
                userId="me",
                id=message_id,
                body={"addLabelIds": add_labels, "removeLabelIds": remove_labels},
            ),
            callback=callback,
            request_id=message_id,
        )

    batch.execute()

    # Return the updated messages
    results = []
    for message_id in message_ids:
        try:
            message = (
                service.users().messages().get(userId="me", id=message_id).execute()
            )
            results.append(message)
        except HttpError as error:
            print(f"Error getting message {message_id}: {error}")

    return results


def mark_messages_as_read(service, message_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Mark Gmail messages as read by removing the UNREAD label.

    Args:
        service: Gmail API service instance
        message_ids: List of message IDs to mark as read

    Returns:
        List of modified messages
    """
    return modify_message_labels(service, message_ids, remove_labels=["UNREAD"])


def mark_messages_as_unread(service, message_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Mark Gmail messages as unread by adding the UNREAD label.

    Args:
        service: Gmail API service instance
        message_ids: List of message IDs to mark as unread

    Returns:
        List of modified messages
    """
    return modify_message_labels(service, message_ids, add_labels=["UNREAD"])


def star_messages(service, message_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Star Gmail messages by adding the STARRED label.

    Args:
        service: Gmail API service instance
        message_ids: List of message IDs to star

    Returns:
        List of modified messages
    """
    logger.info(f"Starring {len(message_ids)} messages")
    return modify_message_labels(service, message_ids, add_labels=["STARRED"])


def unstar_messages(service, message_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Unstar Gmail messages by removing the STARRED label.

    Args:
        service: Gmail API service instance
        message_ids: List of message IDs to unstar

    Returns:
        List of modified messages
    """
    logger.info(f"Unstarring {len(message_ids)} messages")
    return modify_message_labels(service, message_ids, remove_labels=["STARRED"])


def trash_messages(service, message_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Move Gmail messages to trash.

    Args:
        service: Gmail API service instance
        message_ids: List of message IDs to trash

    Returns:
        List of modified messages
    """
    logger.info(f"Moving {len(message_ids)} messages to trash")
    batch = service.new_batch_http_request()
    results = []

    def callback(request_id, response, exception):
        if exception:
            logger.error(f"Error trashing message {request_id}: {exception}")
        elif response:
            results.append(response)

    for message_id in message_ids:
        batch.add(
            service.users().messages().trash(userId="me", id=message_id),
            callback=callback,
            request_id=message_id,
        )

    batch.execute()
    return results


def untrash_messages(service, message_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Restore Gmail messages from trash.

    Args:
        service: Gmail API service instance
        message_ids: List of message IDs to restore from trash

    Returns:
        List of modified messages
    """
    logger.info(f"Restoring {len(message_ids)} messages from trash")
    batch = service.new_batch_http_request()
    results = []

    def callback(request_id, response, exception):
        if exception:
            logger.error(f"Error untrashing message {request_id}: {exception}")
        elif response:
            results.append(response)

    for message_id in message_ids:
        batch.add(
            service.users().messages().untrash(userId="me", id=message_id),
            callback=callback,
            request_id=message_id,
        )

    batch.execute()
    return results


def archive_messages(service, message_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Archive Gmail messages by removing the INBOX label.

    Args:
        service: Gmail API service instance
        message_ids: List of message IDs to archive

    Returns:
        List of modified messages
    """
    logger.info(f"Archiving {len(message_ids)} messages")
    return modify_message_labels(service, message_ids, remove_labels=["INBOX"])


def move_to_inbox(service, message_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Move Gmail messages to inbox by adding the INBOX label.

    Args:
        service: Gmail API service instance
        message_ids: List of message IDs to move to inbox

    Returns:
        List of modified messages
    """
    logger.info(f"Moving {len(message_ids)} messages to inbox")
    return modify_message_labels(service, message_ids, add_labels=["INBOX"])
