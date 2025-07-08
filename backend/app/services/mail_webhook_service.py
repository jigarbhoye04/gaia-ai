import json

from app.config.loggers import mail_webhook_logger as logger
from app.db.rabbitmq import publisher


async def queue_email_processing(email_address: str, history_id: int) -> dict:
    """
    Queue an email for background processing.

    Args:
        email_address (str): The email address associated with the webhook
        history_id (int): The history ID from the webhook

    Returns:
        dict: Response message indicating success
    """
    logger.info(
        f"Queueing email processing: email={email_address}, historyId={history_id}"
    )

    await publisher.publish(
        queue_name="email-events",
        body=json.dumps(
            {
                "email_address": email_address,
                "history_id": history_id,
            }
        ).encode("utf-8"),
    )

    return {"message": "Email processing started successfully."}
