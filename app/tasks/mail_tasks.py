import time
from datetime import datetime, timedelta, timezone

from celery import shared_task
from googleapiclient.errors import HttpError

from app.config.loggers import celery_logger as logger
from app.db.collections import mail_collection
from app.prompts.user.mail_prompts import EMAIL_SUMMARIZER_SHORT
from app.utils.llm_utils import do_prompt_no_stream_sync
from app.services.mail_service import fetch_detailed_messages, get_gmail_service
from app.utils.text_utils import classify_email, remove_stopwords
from app.utils.general_utils import transform_gmail_message
from app.utils.profiler_utils import profile_celery_task


@shared_task(name="process.email", rate_limit="5/s")
@profile_celery_task(print_lines=3)
def process_email(email_data: dict, user_dict: dict):
    """Processes an email.

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
        snippet = email_data.get("snippet", None)
        body = email_data.get("body", "Unknown body")

        combined_text = f"{subject} {body}".strip()
        filtered_text = remove_stopwords(combined_text)

        logger.info(f"{subject=}")
        logger.info(f"{snippet=}")

        summary_response = do_prompt_no_stream_sync(
            prompt=EMAIL_SUMMARIZER_SHORT.format(
                subject=subject,
                body=body,
                snippet=snippet,
                time=email_data.get("time", ""),
                sender=email_data.get("from", "No sender"),
            ),
            model="@cf/meta/llama-3.2-3b-instruct",
        )

        # Handle potential non-dict response
        summary = None
        if isinstance(summary_response, dict):
            summary = summary_response.get("response", None)

        logger.info(f"{summary=}")

        classified = classify_email(email_text=filtered_text, async_mode=False)

        if isinstance(classified, dict):
            classification_result = classified

        logger.info(f"{classification_result=}")

        # Check for Gmail's native important markers
        is_important_by_gmail = False
        label_ids = email_data.get("labelIds", [])
        gmail_important_labels = ["IMPORTANT", "CATEGORY_PRIORITY"]

        for label in gmail_important_labels:
            if label in label_ids:
                is_important_by_gmail = True
                logger.info(f"Email marked as important by Gmail with label: {label}")
                break

        is_important = (
            classification_result and classification_result.get("is_important", False)
        ) or is_important_by_gmail

        if is_important:
            email_record = {
                "email_id": email_id,
                "subject": subject,
                "processed_at": datetime.now(),
                "is_important": True,
                "user_id": user_id,
                "summary": summary,
            }

            # Add classification_result items if it's a dictionary
            if isinstance(classification_result, dict):
                email_record.update(classification_result)

            query = {"email_id": email_id, "user_id": user_id}

            logger.info("Updating in mongodb")

            mail_collection.update_one(query, {"$set": email_record}, upsert=True)

            logger.info(
                f"Stored important email for user {user_id}: {subject} (ID: {email_id})"
            )

        result = {
            "email_id": email_id,
            "subject": subject,
            "processed_at": datetime.now(),
            "user_id": user_id,
            "summary": summary,
            "is_important": is_important,
        }

        # Add classification_result items if it's a dictionary
        if isinstance(classification_result, dict):
            result.update(classification_result)

        return result

    except Exception as e:
        logger.error(f"Error processing email: {e}", exc_info=True)
        return {"error": str(e), "status": "failed"}


@shared_task(name="fetch.last_week_emails")
@profile_celery_task()
def fetch_last_week_emails(user_dict: dict):
    """
    Fetch all emails from the last week using pagination and queue them for processing.
    Implements rate limiting, logging, and error handling.
    """
    try:
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

                if isinstance(results, dict):
                    messages = results.get("messages", [])
                    all_messages.extend(messages)

                    logger.info(
                        f"Fetched {len(messages)} messages (Total: {len(all_messages)})"
                    )

                    next_page_token = results.get("nextPageToken")
                    if not next_page_token:
                        break
                else:
                    logger.error("Unexpected result type from Gmail API")
                    break

                time.sleep(3)

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

        result = f"Queued {len(transformed_messages)} emails for processing."

        logger.info(result)

        return {
            "result": result,
            "total_messages": len(all_messages),
        }

    except Exception as e:
        logger.error(f"Unexpected error fetching emails: {e}", exc_info=True)
        return {"error": str(e)}
