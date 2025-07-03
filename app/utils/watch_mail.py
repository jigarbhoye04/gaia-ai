import asyncio

from app.config.loggers import app_logger as logger
from app.config.settings import settings
from app.db.redis import set_cache
from app.services.mail_service import get_gmail_service
from app.services.user_service import update_user_profile


async def watch_mail(
    email: str,
    access_token: str,
    refresh_token: str,
    user_id: str,
) -> None:
    """
    Set up Gmail push notifications for the user's inbox.
    Requires user's OAuth access token and Pub/Sub topic name.
    """
    try:
        logger.info(f"Starting to watch emails for user ({email})")

        # Build Credentials object from access token
        # Build Gmail API client
        service = get_gmail_service(
            access_token=access_token,
            refresh_token=refresh_token,
        )

        # Gmail Watch Request body
        request_body = {
            "labelIds": ["INBOX"],
            "topicName": settings.GCP_TOPIC_NAME,  # Pub/Sub topic name
            "labelFilterBehavior": "INCLUDE",
        }

        # Make API call
        response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: service.users().watch(userId="me", body=request_body).execute(),
        )

        if not response or "historyId" not in response:
            raise ValueError("Invalid response from Gmail API")

        logger.info(
            f"Successfully started watching emails for user ({email}). "
            f"History ID: {response.get('historyId')}"
        )

        await update_user_profile(
            user_id=user_id,
            data={
                "gmail_history_id": response["historyId"],
                "gmail_watch_enabled": True,
            },
        )

        # Optionally, store the history ID in Redis for quick access
        await set_cache(
            f"gmail_history_id:{email}",
            response["historyId"],
            ttl=7 * 24 * 60 * 60,  # 7 Days
        )

        # TODO: Process all the mails from the last history ID

    except Exception as e:
        logger.error(
            f"Failed to start watching emails for user ({email}): {str(e)}",
            exc_info=True,
        )
