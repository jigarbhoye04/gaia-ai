"""
Reminder task handlers for different types of reminders.
"""


from app.config.loggers import general_logger as logger
from app.langchain.core.agent import call_reminder_agent
from app.models.reminder_models import (
    AgentType,
    AIAgentReminderPayload,
    ReminderModel,
    StaticReminderPayload,
)
from app.services.notification_service import notification_service
from app.utils.notification.sources import create_reminder_notification
from app.utils.oauth_utils import get_tokens_by_user_id


async def execute_reminder_by_agent(
    reminder: ReminderModel,
    access_token: str | None = None,
    refresh_token: str | None = None,
):
    """
    Execute a reminder task based on its type.

    Args:
        reminder: The reminder to execute
    """
    logger.info(f"Executing reminder: {reminder.id} for agent: {reminder.agent}")

    if not reminder.id:
        logger.error(f"Reminder {reminder.id} has no ID, skipping execution.")
        raise ValueError(f"Reminder {reminder.id} has no ID, skipping execution.")

    if reminder.agent == AgentType.AI_AGENTS and isinstance(
        reminder.payload, AIAgentReminderPayload
    ):
        access_token, refresh_token, success = await get_tokens_by_user_id(
            user_id=reminder.user_id
        )  # Ensure tokens are fetched

        if not success:
            logger.error(
                f"Failed to get valid tokens for user {reminder.user_id} while executing reminder {reminder.id}"
            )
            raise ValueError(
                f"Failed to get valid tokens for user {reminder.user_id} while executing reminder {reminder.id}"
            )

        notification_data = await call_reminder_agent(
            instruction=reminder.payload.instructions,
            user_id=reminder.user_id,
            reminder_id=reminder.id,
            access_token=access_token,
            refresh_token=refresh_token,
        )

        notification = create_reminder_notification(
            title=notification_data.title,
            body=notification_data.body,
            reminder_id=reminder.id,
            user_id=reminder.user_id,
            actions=[],
        )
        await notification_service.create_notification(notification)

        if not notification_data:
            logger.error(
                f"AI agent reminder {reminder.id} returned no notification data for user {reminder.user_id}"
            )
            raise ValueError(
                f"AI agent reminder {reminder.id} returned no notification data"
            )

    elif reminder.agent == AgentType.STATIC and isinstance(
        reminder.payload, StaticReminderPayload
    ):
        # STATIC agent simply sends title and body as-is
        title = reminder.payload.title
        body = reminder.payload.body

        notification = create_reminder_notification(
            title=title,
            body=body,
            reminder_id=reminder.id,
            user_id=reminder.user_id,
            actions=[],
        )
        await notification_service.create_notification(notification)

        logger.info(
            f"Static reminder {reminder.id} sent notification to user {reminder.user_id}"
        )

    logger.info(
        f"Reminder {reminder.id} executed successfully for agent: {reminder.agent}"
    )
