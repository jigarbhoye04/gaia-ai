from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, List

from app.models.calendar_models import EventCreateRequest
from app.models.notification.notification_models import (
    ActionConfig,
    ActionStyle,
    ActionType,
    ApiCallConfig,
    ChannelConfig,
    ModalConfig,
    NotificationAction,
    NotificationContent,
    NotificationRequest,
    NotificationRules,
    NotificationSourceEnum,
    NotificationType,
    RedirectConfig,
)


class NotificationSource(ABC):
    """Base class for notification sources"""

    @property
    @abstractmethod
    def source_id(self) -> str:
        pass

    @abstractmethod
    async def trigger(self, context: Any) -> List[NotificationRequest]:
        pass

    def validate(self, request: NotificationRequest) -> bool:
        """Optional validation for notification requests"""
        return True


# AI Proactive Source Example
class AIEmailDraftSource(NotificationSource):
    """Source for AI-generated email draft notifications"""

    @property
    def source_id(self) -> str:
        return "ai-email-draft"

    async def trigger(self, context: Dict[str, Any]) -> List[NotificationRequest]:
        """Generate email draft notification"""

        return [
            create_email_draft_notification(
                user_id=context["user_id"],
                draft_id=context["draft_id"],
                original_email_id=context["original_email_id"],
            )
        ]


class AIEmailCalendarSource(NotificationSource):
    """Source for AI-generated calendar event notifications"""

    @property
    def source_id(self) -> str:
        return "ai-calendar-event"

    async def trigger(self, context: Dict[str, Any]) -> List[NotificationRequest]:
        """Generate calendar event notification"""
        return create_calendar_event_notification(
            user_id=context["user_id"],
            notification_data=context["notification_data"],
        )


# Example notification for email draft scenario
def create_email_draft_notification(
    user_id: str, draft_id: str, original_email_id: str
) -> NotificationRequest:
    """Create notification for AI-drafted email"""
    return NotificationRequest(
        user_id=user_id,
        source=NotificationSourceEnum.AI_EMAIL_DRAFT,
        type=NotificationType.INFO,
        priority=2,
        channels=[ChannelConfig(channel_type="inapp", enabled=True, priority=1)],
        content=NotificationContent(
            title="Email draft ready for review",
            body="I've drafted a response to John's email about the project timeline. Would you like to review and send?",
            actions=[
                NotificationAction(
                    type=ActionType.API_CALL,
                    label="Send Now",
                    style=ActionStyle.PRIMARY,
                    requires_confirmation=True,
                    confirmation_message="Are you sure you want to send this email?",
                    config=ActionConfig(
                        api_call=ApiCallConfig(
                            endpoint="/api/emails/send",
                            method="POST",
                            payload={"draft_id": draft_id},
                            success_message="Email sent successfully!",
                            error_message="Failed to send email",
                        )
                    ),
                ),
                NotificationAction(
                    type=ActionType.REDIRECT,
                    label="Review in Gmail",
                    style=ActionStyle.SECONDARY,
                    config=ActionConfig(
                        redirect=RedirectConfig(
                            url=f"https://mail.google.com/mail/u/0/#drafts/{draft_id}",
                            open_in_new_tab=True,
                            close_notification=False,
                        )
                    ),
                ),
                NotificationAction(
                    type=ActionType.MODAL,
                    label="Edit Here",
                    style=ActionStyle.SECONDARY,
                    config=ActionConfig(
                        modal=ModalConfig(
                            component="EmailEditModal", props={"draft_id": draft_id}
                        )
                    ),
                ),
            ],
        ),
        metadata={
            "draft_id": draft_id,
            "original_email_id": original_email_id,
            "ai_confidence": 0.85,
            "email_subject": "Re: Project Timeline Discussion",
            "recipient": "john@example.com",
        },
        rules=NotificationRules(
            max_retries=2, expire_after_hours=24, respect_quiet_hours=True
        ),
    )


def create_calendar_event_notification(
    user_id: str,
    notification_data: List[EventCreateRequest],
) -> List[NotificationRequest]:
    """Create notification for AI-generated calendar event"""
    print("Creating calendar event notifications for user:", user_id)

    try:
        return [
            NotificationRequest(
                user_id=user_id,
                source=NotificationSourceEnum.AI_CALENDAR_EVENT,
                type=NotificationType.INFO,
                priority=2,
                channels=[
                    ChannelConfig(channel_type="inapp", enabled=True, priority=1)
                ],
                content=NotificationContent(
                    title="New Calendar Event Created",
                    body=notification.description,
                    actions=[
                        NotificationAction(
                            type=ActionType.API_CALL,
                            label="Confirm Event",
                            style=ActionStyle.SECONDARY,
                            requires_confirmation=True,
                            confirmation_message="Are you sure you want to confirm this event?",
                            config=ActionConfig(
                                api_call=ApiCallConfig(
                                    endpoint="/api/v1/calendar/event",
                                    method="POST",
                                    payload=notification.model_dump(),
                                    success_message="Event confirmed successfully!",
                                    error_message="Failed to confirm event",
                                    is_internal=True,
                                )
                            ),
                        ),
                    ],
                ),
                metadata={
                    "notification": notification.model_dump(),
                    "event_title": notification.summary,
                    "event_description": notification.description,
                    "event_time": "2023-10-15T10:00:00Z",
                },
                rules=NotificationRules(
                    max_retries=2, expire_after_hours=24, respect_quiet_hours=True
                ),
            )
            for notification in notification_data
        ]
    except Exception as e:
        print(f"Error creating calendar event notification: {e}")
        return []


def create_reminder_notification(
    user_id: str,
    reminder_id: str,
    title: str,
    body: str,
    actions: List[NotificationAction],
) -> NotificationRequest:
    """Create notification for a reminder"""
    return NotificationRequest(
        user_id=user_id,
        source=NotificationSourceEnum.AI_REMINDER,
        type=NotificationType.INFO,
        priority=1,
        channels=[ChannelConfig(channel_type="inapp", enabled=True, priority=1)],
        content=NotificationContent(
            title=title,
            body=body,
            actions=actions,
        ),
        metadata={
            "reminder_id": reminder_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
        rules=NotificationRules(
            max_retries=3, expire_after_hours=48, respect_quiet_hours=True
        ),
    )
