import time
import logging
from datetime import datetime, timedelta, timezone

from celery import shared_task
from googleapiclient.errors import HttpError

from app.services.mail_service import fetch_detailed_messages, get_gmail_service
from app.utils.general_utils import transform_gmail_message


# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@shared_task(name="process.email")
def process_email(email_data: dict):
    """Processes an email asynchronously."""
    try:
        time.sleep(2)  # Simulate processing time
        return {**email_data}
    except Exception as e:
        logger.error(f"Error processing email: {e}", exc_info=True)
        return {"error": str(e)}


@shared_task(name="fetch.last_week_emails")
def fetch_last_week_emails(user_dict: dict):
    """
    Fetch all emails from the last week using pagination and queue them for processing.
    Implements rate limiting, logging, and error handling.
    """
    try:
        # Initialize Gmail service
        service = get_gmail_service(user_dict)

        # Get last week's timestamp
        now = datetime.now(timezone.utc)
        last_week = now - timedelta(days=7)
        query = f"after:{int(last_week.timestamp())}"

        all_messages = []
        next_page_token = None

        logger.info("Fetching emails from Gmail...")

        while True:
            try:
                # Fetch a single page of emails
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

                # Check if there's another page
                next_page_token = results.get("nextPageToken")
                if not next_page_token:
                    break  # Exit loop if no more pages

                time.sleep(1)  # Rate limiting delay

            except HttpError as e:
                logger.error(f"Gmail API Error: {e}", exc_info=True)
                time.sleep(5)  # Exponential backoff retry
                continue

        if not all_messages:
            logger.info("No new emails found in the last week.")
            return {"result": "No emails to process."}

        # Fetch detailed email data with rate limiting
        detailed_messages = fetch_detailed_messages(service, all_messages)
        transformed_messages = [
            transform_gmail_message(msg) for msg in detailed_messages
        ]

        # Queue emails for processing with controlled task execution
        for idx, email in enumerate(transformed_messages):
            process_email.delay(email)
            time.sleep(0.5)  # Small delay to prevent overwhelming Celery workers

        logger.info(f"Queued {len(transformed_messages)} emails for processing.")

        return {
            "result": f"Queued {len(transformed_messages)} emails for processing.",
            "total_messages": len(all_messages),
        }

    except Exception as e:
        logger.error(f"Unexpected error fetching emails: {e}", exc_info=True)
        return {"error": str(e)}
