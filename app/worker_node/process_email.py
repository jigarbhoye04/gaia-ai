import asyncio
import base64
import json
from html import unescape
from typing import Any

from bs4 import BeautifulSoup
from bson import ObjectId

from app.api.v1.dependencies.oauth_dependencies import get_valid_access_token
from app.config.loggers import worker_logger as logger
from app.db.collections import users_collection
from app.db.redis import get_cache, set_cache
from app.langchain.core.agent import call_mail_processing_agent
from app.services.mail_service import (
    get_gmail_service,
)
from app.services.user_service import get_user_by_email, get_user_by_id

# ============================================================================
# Main Processing
# ============================================================================


async def process_emails(history_id: int, email: str):
    """
    Process emails for a user identified by email address.
    This function gets the user info and delegates to process_emails_by_user_id.
    """
    try:
        if not email or not history_id:
            logger.error("Email address or history ID is missing")
            return {
                "error": "Email address or history ID is missing",
                "status": "failed",
            }

        # Get user information by email
        user = await get_user_by_email(email)
        if not user:
            return {"error": "User not found", "status": "failed"}

        # Extract user_id from user document
        user_id = str(user.get("_id"))
        if not user_id:
            logger.error(f"No user_id found for email: {email}")
            return {"error": "User ID not found", "status": "failed"}

        # Delegate to user_id based processing
        return await process_emails_by_user_id(history_id, user_id, email)

    except Exception as e:
        logger.error(f"Error processing email: {e}", exc_info=True)
        return {"error": str(e), "status": "failed"}


async def _process_email(
    message: dict,
    user_id: str,
    access_token: str,
    refresh_token: str,
):
    """Process individual email message with user context."""
    # Extract relevant information from the message
    content = extract_string_content(message)
    subject = extract_subject(message)
    sender = extract_sender(message)
    date = extract_date(message)
    labels = extract_labels(message)
    # attachments = extract_attachments(message)

    # Process attachments if any
    # processed_attachments = []
    # for attachment in attachments:
    #     processed_attachment = await process_attachment(attachment, service, "me")
    #     if processed_attachment:
    #         processed_attachments.append(processed_attachment)

    # Log or store the processed message as needed
    logger.info(
        f"Processing email for user {user_id}: subject={subject}, sender={sender}, date={date}, "
        f"labels={labels}"
    )
    logger.info(f"Message content: {content}")

    # Create email metadata
    email_metadata = {
        "subject": subject,
        "sender": sender,
        "date": date,
        "labels": labels,
        "message_id": message.get("id", ""),
    }

    # Call the mail processing agent with proper user context
    result = await call_mail_processing_agent(
        email_content=content,
        user_id=user_id,
        email_metadata=email_metadata,
        access_token=access_token,
        refresh_token=refresh_token,
    )

    logger.info(f"Email processing result for user {user_id}: {result}")
    return result


async def process_emails_by_user_id(history_id: int, user_id: str, email: str):
    """
    Process emails for a user identified by user ID.
    """
    try:
        if not user_id or not history_id:
            logger.error("User ID or history ID is missing")
            return {
                "error": "User ID or history ID is missing",
                "status": "failed",
            }

        if not email:
            logger.error(f"No email found for user_id: {user_id}")
            return {"error": "User email not found", "status": "failed"}

        previous_history_id = await _get_history_id_by_user_id(user_id)
        if not previous_history_id:
            logger.error(f"Previous History ID not found for user: {user_id}")
            return {"error": "History not found", "status": "failed"}

        access_token, refresh_token, tokens_valid = await _get_tokens_by_user_id(
            user_id
        )
        if not tokens_valid:
            return {"error": "Authentication failed", "status": "failed"}

        service = get_gmail_service(
            access_token=access_token,
            refresh_token=refresh_token,
        )

        messages = await _fetch_messages_by_history(
            history_id=previous_history_id, service=service
        )
        history = messages.get("history", [])
        if not history:
            logger.info(f"No new messages found for user: {user_id}")
            return {
                "status": "success",
                "message": "No new messages found",
                "history_count": 0,
            }

        added_messages = []

        for item in history:
            if "messagesAdded" in item:
                added_messages.extend(item["messagesAdded"])

        full_messages = await fetch_all_messages(
            service=service,
            user_id="me",
            message_ids=[msg["message"]["id"] for msg in added_messages],
        )

        # Process the messages with user context
        processing_results = []
        for message in full_messages:
            if not message:
                continue
            result = await _process_email(message, user_id, access_token, refresh_token)
            processing_results.append(result)

        # Update the history ID after processing
        await _update_history_id_by_user_id(user_id, history_id)

        return {
            "status": "success",
            "message": "Email history processed successfully",
            "user_id": user_id,
            "history_count": len(messages.get("history", [])),
            "processed_messages": len(processing_results),
            "processing_results": processing_results,
        }

    except Exception as e:
        logger.error(f"Error processing email for user {user_id}: {e}", exc_info=True)
        return {"error": str(e), "status": "failed", "user_id": user_id}


# ============================================================================
# Email Extraction Utilities
# ============================================================================


def extract_string_content(message: dict) -> str:
    """
    Extracts the string content from a Gmail message.
    Extracted content can be plain text or HTML, depending on the message format.
    If the message is in HTML format, it will be converted to plain text.
    Args:
        message (dict): The Gmail message object.
    Returns:
        str: The extracted string content.
    """

    payload = message.get("payload", {})
    mime_type = payload.get("mimeType", "")

    content = ""

    if mime_type == "text/plain":
        # If the message is already in plain text or HTML format, extract directly
        data = payload.get("body", {}).get("data", "")
        if data:
            decoded_bytes = base64.urlsafe_b64decode(data)
            content += decoded_bytes.decode("utf-8").strip()
    elif mime_type == "text/html":
        # If the message is in HTML format, decode and extract text
        data = payload.get("body", {}).get("data", "")
        if data:
            decoded_bytes = base64.urlsafe_b64decode(data)
            html_data = decoded_bytes.decode("utf-8")
            soup = BeautifulSoup(unescape(html_data), "html.parser")
            content += soup.get_text()
    elif mime_type.startswith("multipart/"):
        # If the message is multipart, we need to check its parts
        parts = payload.get("parts", [])

        if parts:
            content += _parse_mail_parts(parts)

    return content.strip()


def _parse_mail_parts(parts: list[dict]) -> str:
    """
    Recursively parses the parts of a Gmail message to extract text content.
    Args:
        parts (list[dict]): The list of parts in the Gmail message.
    Returns:
        str: The combined text content from all parts.
    """
    content = ""
    for part in parts:
        mime_type = part.get("mimeType", "")
        if mime_type == "text/plain":
            data = part.get("body", {}).get("data", "")
            if data:
                decoded_bytes = base64.urlsafe_b64decode(data)
                content += decoded_bytes.decode("utf-8")
        elif mime_type == "text/html":
            data = part.get("body", {}).get("data", "")
            if data:
                decoded_bytes = base64.urlsafe_b64decode(data)
                html_data = decoded_bytes.decode("utf-8")
                soup = BeautifulSoup(unescape(html_data), "html.parser")
                content += soup.get_text()
        elif "parts" in part:
            content += _parse_mail_parts(part["parts"])
    return content.strip()


def extract_subject(message: dict) -> str:
    """
    Extracts the subject from a Gmail message.
    Args:
        message (dict): The Gmail message object.
    Returns:
        str: The subject of the email.
    """
    headers = message.get("payload", {}).get("headers", [])
    for header in headers:
        if header.get("name") == "Subject":
            return header.get("value", "")
    return ""


def extract_sender(message: dict) -> str:
    """
    Extracts the sender's email address from a Gmail message.
    Args:
        message (dict): The Gmail message object.
    Returns:
        str: The sender's email address.
    """
    headers = message.get("payload", {}).get("headers", [])
    for header in headers:
        if header.get("name") == "From":
            return header.get("value", "")
    return ""


def extract_date(message: dict) -> str:
    """
    Extracts the date from a Gmail message.
    Args:
        message (dict): The Gmail message object.
    Returns:
        str: The date of the email.
    """
    headers = message.get("payload", {}).get("headers", [])
    for header in headers:
        if header.get("name") == "Date":
            return header.get("value", "")
    return ""


def extract_labels(message: dict) -> list[str]:
    """
    Extracts the labels from a Gmail message.
    Args:
        message (dict): The Gmail message object.
    Returns:
        list[str]: A list of labels associated with the email.
    """
    return message.get("labelIds", [])


def extract_attachments(message: dict) -> list[dict]:
    """
    Extracts the attachments from a Gmail message.
    Args:
        message (dict): The Gmail message object.
    Returns:
        list[dict]: A list of attachment objects.
    """
    attachments = []
    parts = message.get("payload", {}).get("parts", [])

    for part in parts:
        if part.get("filename") and part.get("body", {}).get("attachmentId"):
            attachments.append(
                {
                    "filename": part["filename"],
                    "attachmentId": part["body"]["attachmentId"],
                    "mimeType": part.get("mimeType", ""),
                    "messageId": message.get("id", ""),
                }
            )

    return attachments


# ============================================================================
# Gmail Service Utilities
# ============================================================================


async def process_attachment(attachment: dict, service: Any, user_id: str) -> dict:
    """
    Processes an attachment by fetching its content from Gmail API.

    Args:
        attachment (dict): The attachment object containing filename and attachmentId.
        service: The Gmail API service instance.
        user_id (str): The user ID for the Gmail API.

    Returns:
        dict: A dictionary containing the filename and content of the attachment.
    """
    attachment_id = attachment.get("attachmentId")
    if not attachment_id:
        return {}

    attachment_content = await asyncio.to_thread(
        lambda: service.users()
        .messages()
        .attachments()
        .get(userId=user_id, id=attachment_id, messageId=attachment.get("messageId"))
        .execute()
    )

    return {
        "filename": attachment.get("filename"),
        "data": attachment_content.get("data"),
        "mimeType": attachment.get("mimeType"),
    }


async def fetch_message_by_id(service, user_id, msg_id):
    try:
        return await asyncio.to_thread(
            lambda: service.users()
            .messages()
            .get(userId=user_id, id=msg_id, format="full")
            .execute()
        )
    except Exception as e:
        print(f"Failed to fetch message {msg_id}: {e}")
        return None


async def fetch_all_messages(service, user_id, message_ids):
    """
    Fetches all messages by their IDs using the Gmail API.

    Args:
        service: The Gmail API service instance.
        user_id: The user ID for the Gmail API.
        message_ids: A list of message IDs to fetch.

    Returns:
        list: A list of full message objects.
    """
    tasks = [fetch_message_by_id(service, user_id, msg_id) for msg_id in message_ids]
    return await asyncio.gather(*tasks)


# ============================================================================
# History ID Management
# ============================================================================


async def _get_history_id_by_user_id(user_id: str) -> int | None:
    """
    Retrieve and validate the history ID from cache or database by user ID.

    Args:
        user_id: The user's ID

    Returns:
        int: History ID or None if not found
    """
    try:
        cache_key = f"gmail_history_id:{user_id}"

        # Try to get history ID from cache first
        cached_history_id = await get_cache(cache_key)
        if cached_history_id:
            return int(cached_history_id)

        # If not in cache, get from database
        user = await get_user_by_id(user_id)
        if not user:
            logger.error(f"No user found with ID: {user_id}")
            return None

        db_history_id = user.get("gmail_history_id")
        if not db_history_id:
            logger.error(f"No history ID found for user: {user_id}")
            return None

        return int(db_history_id)
    except (ValueError, TypeError) as e:
        logger.error(f"Invalid history ID for user {user_id}: {e}")
        return None


async def _update_history_id_by_user_id(user_id: str, history_id: int) -> None:
    """
    Update the history ID in both database and cache by user ID.

    Args:
        user_id: The user's ID
        history_id: The history ID to update
    """

    cache_key = f"gmail_history_id:{user_id}"

    try:
        object_id = ObjectId(user_id)
        result = await users_collection.update_one(
            {"_id": object_id},
            {"$set": {"gmail_history_id": history_id}},
        )

        if result.modified_count > 0:
            # Update in cache
            await set_cache(cache_key, history_id)
            logger.info(f"Updated history ID for user {user_id}: {history_id}")
        else:
            logger.warning(f"No user updated for user_id: {user_id}")

    except Exception as e:
        logger.error(f"Error updating history ID for user {user_id}: {e}")


async def _get_tokens_by_user_id(user_id: str) -> tuple[str, str, bool]:
    """
    Get valid access and refresh tokens for the user by user ID.

    Args:
        user_id: The user's ID

    Returns:
        tuple: (access_token, refresh_token, success_flag)
    """

    # Get user to find email for token operations
    user = await get_user_by_id(user_id)
    if not user:
        logger.error(f"User not found for ID: {user_id}")
        return "", "", False

    email = user.get("email")
    if not email:
        logger.error(f"No email found for user_id: {user_id}")
        return "", "", False

    # Get refresh token from cache (still using email as cache key for now)
    cache_key = f"user_refresh:{email}"
    cached_data = await get_cache(cache_key)

    if not cached_data:
        logger.error(f"Refresh token not found in cache for user: {user_id}")
        return "", "", False

    # Parse the cached token based on its type
    if isinstance(cached_data, str):
        try:
            parsed_data = json.loads(cached_data)
            refresh_token = parsed_data.get("refresh_token")
        except json.JSONDecodeError:
            refresh_token = None
    elif isinstance(cached_data, dict):
        refresh_token = cached_data.get("refresh_token")
    else:
        refresh_token = None

    if not refresh_token:
        logger.error(f"Invalid or missing refresh token for user: {user_id}")
        return "", "", False

    # Get access token using the refresh token
    access_token, _ = await get_valid_access_token(
        user_email=email,
        refresh_token=refresh_token,
    )

    if not access_token:
        logger.error(f"Failed to get access token for user: {user_id}")
        return "", refresh_token, False

    return access_token, refresh_token, True


async def _fetch_messages_by_history(history_id: int, service: Any) -> dict:
    """
    Fetch messages from Gmail API using the history ID.

    Args:
        history_id: The history ID to use for fetching messages
        service: The Gmail API service instance

    Returns:
        dict: The messages response from Gmail API
    """

    return await asyncio.to_thread(
        lambda: service.users()
        .history()
        .list(
            userId="me",
            startHistoryId=history_id,
            historyTypes=["messageAdded"],
        )
        .execute()
    )
