import time
from datetime import datetime, timedelta, timezone
import asyncio
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

from celery import shared_task
from celery.utils.log import get_task_logger
from googleapiclient.errors import HttpError

from app.services.mail_service import fetch_detailed_messages, get_gmail_service
from app.utils.general_utils import transform_gmail_message
from app.services.text_service import classify_email
from app.db.collections import mail_collection

logger = get_task_logger(__name__)


def remove_stopwords(text):
    """Remove stopwords from text."""
    try:
        # Download stopwords if not already available
        nltk.download("stopwords", quiet=True)
        nltk.download("punkt", quiet=True)

        stop_words = set(stopwords.words("english"))
        word_tokens = word_tokenize(text)

        # Filter out stopwords
        filtered_text = [word for word in word_tokens if word.lower() not in stop_words]
        return " ".join(filtered_text)
    except Exception as e:
        logger.warning(f"Error removing stopwords: {e}")
        return text  # Return original text if there's an error


@shared_task(name="process.email")
def process_email(email_data: dict, user_dict: dict):
    """Processes an email asynchronously.

    Args:
        email_data: A dictionary containing email data
        user_dict: A dictionary containing user data, must include user_id

    Returns:
        A dictionary with the processing results
    """
    try:
        if not user_dict or "user_id" not in user_dict:
            error_msg = "User ID is required for processing emails"
            logger.error(error_msg)
            return {"error": error_msg, "status": "failed"}

        user_id = user_dict["user_id"]

        email_id = email_data.get("id", None)
        if not email_id:
            error_msg = "Email ID is required"
            logger.error(error_msg)
            return {"error": error_msg, "status": "failed"}

        subject = email_data.get("subject", "No subject")
        body = email_data.get("snippet", "") or email_data.get("body", "")

        combined_text = f"{subject} {body}".strip()
        # filtered_text = remove_stopwords(combined_text)

        loop = asyncio.get_event_loop()
        # classification_result = loop.run_until_complete(classify_email(filtered_text))
        classification_result = loop.run_until_complete(classify_email(combined_text))

        if classification_result and classification_result.get("is_important", False):
            email_record = {
                "email_id": email_id,
                "subject": subject,
                "category": classification_result.get("highest_label", "unknown"),
                "importance_score": classification_result.get("highest_score", 0),
                "processed_at": datetime.now(),
                "is_important": True,
                "user_id": user_id,
            }

            query = {"email_id": email_id, "user_id": user_id}

            mail_collection.update_one(query, {"$set": email_record}, upsert=True)

            logger.info(
                f"Stored important email for user {user_id}: {subject} (ID: {email_id})"
            )

        return {
            "id": email_id,
            "status": "processed",
            "subject": subject,
            "user_id": user_id,
            "is_important": classification_result.get("is_important", False)
            if classification_result
            else False,
        }
    except Exception as e:
        logger.error(f"Error processing email: {e}", exc_info=True)
        return {"error": str(e), "status": "failed"}


@shared_task(name="fetch.last_week_emails")
def fetch_last_week_emails(user_dict: dict):
    """
    Fetch all emails from the last week using pagination and queue them for processing.
    Implements rate limiting, logging, and error handling.
    """
    try:
        count = 0
        service = get_gmail_service(user_dict)

        now = datetime.now(timezone.utc)
        last_week = now - timedelta(days=7)
        query = f"after:{int(last_week.timestamp())}"

        all_messages = []
        next_page_token = None

        logger.info("Fetching emails from Gmail...")

        while True:
            try:
                results = (
                    service.users()
                    .messages()
                    .list(userId="me", q=query, pageToken=next_page_token)
                    .execute()
                )

                messages = results.get("messages", [])
                all_messages.extend(messages)

                logger.info(
                    f"Fetched {len(messages)} messages (Total: {len(all_messages)})"
                )

                next_page_token = results.get("nextPageToken")
                if not next_page_token:
                    break

                time.sleep(1)

            except HttpError as e:
                logger.error(f"Gmail API Error: {e}", exc_info=True)
                time.sleep(5)
                continue

        if not all_messages:
            logger.info("No new emails found in the last week.")
            return {"result": "No emails to process."}

        detailed_messages = fetch_detailed_messages(service, all_messages)
        transformed_messages = [
            transform_gmail_message(msg) for msg in detailed_messages
        ]

        for _, email in enumerate(transformed_messages):
            process_email.delay(email, user_dict)
            count += 1
            time.sleep(0.5)

        logger.info(f"Queued {count} emails for processing.")

        return {
            "result": f"Queued {count} emails for processing.",
            "total_messages": len(all_messages),
        }

    except Exception as e:
        logger.error(f"Unexpected error fetching emails: {e}", exc_info=True)
        return {"error": str(e)}
