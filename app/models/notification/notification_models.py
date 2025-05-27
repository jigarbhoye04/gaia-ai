from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Literal, Optional, Union
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


class NotificationType(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"


class NotificationStatus(str, Enum):
    PENDING = "pending"
    DELIVERED = "delivered"
    READ = "read"
    SNOOZED = "snoozed"
    ARCHIVED = "archived"


class ActionType(str, Enum):
    REDIRECT = "redirect"
    API_CALL = "api_call"
    WORKFLOW = "workflow"
    MODAL = "modal"


class ActionStyle(str, Enum):
    PRIMARY = "primary"
    SECONDARY = "secondary"
    DANGER = "danger"


class RedirectConfig(BaseModel):
    url: str
    open_in_new_tab: bool = True
    close_notification: bool = False


class ApiCallConfig(BaseModel):
    endpoint: str
    method: Literal["GET", "POST", "PUT", "DELETE"] = "POST"
    payload: Optional[Dict[str, Any]] = None
    headers: Optional[Dict[str, str]] = None
    success_message: Optional[str] = None
    error_message: Optional[str] = None


class WorkflowConfig(BaseModel):
    workflow_id: str
    parameters: Dict[str, Any] = Field(default_factory=dict)


class ModalConfig(BaseModel):
    component: str
    props: Dict[str, Any] = Field(default_factory=dict)


class ActionConfig(BaseModel):
    redirect: Optional[RedirectConfig] = None
    api_call: Optional[ApiCallConfig] = None
    workflow: Optional[WorkflowConfig] = None
    modal: Optional[ModalConfig] = None

    @field_validator(
        "redirect",
        "api_call",
        "workflow",
        "modal",
        mode="before",
    )
    def validate_single_config(cls, v, values):
        """Ensure only one action config is set"""
        configs = [
            values.get("redirect"),
            values.get("api_call"),
            values.get("workflow"),
            values.get("modal"),
        ]
        non_none_configs = [c for c in configs if c is not None]

        if len(non_none_configs) > 1:
            raise ValueError("Only one action config should be specified")
        return v


class NotificationAction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    type: ActionType
    label: str
    style: ActionStyle = ActionStyle.SECONDARY
    config: ActionConfig
    requires_confirmation: bool = False
    confirmation_message: Optional[str] = None
    icon: Optional[str] = None
    disabled: bool = False


class NotificationContent(BaseModel):
    title: str
    body: str
    actions: Optional[List[NotificationAction]] = None
    template_data: Optional[Dict[str, Any]] = None
    rich_content: Optional[Dict[str, Any]] = None  # For HTML, markdown, etc.


class ChannelConfig(BaseModel):
    channel_type: str  # 'inapp', 'email', 'push', etc.
    enabled: bool = True
    priority: int = 1  # 1 highest
    template: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)


class NotificationRules(BaseModel):
    """Rules for notification behavior"""

    max_retries: int = 3
    retry_interval_seconds: int = 300
    expire_after_hours: Optional[int] = None
    respect_quiet_hours: bool = True
    deduplicate_within_minutes: Optional[int] = None


class NotificationRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    source: str  # 'ai-proactive', 'email-trigger', 'background-job'
    type: NotificationType = NotificationType.INFO
    priority: int = Field(default=3, ge=1, le=5)  # 1 highest
    channels: List[ChannelConfig]
    content: NotificationContent
    metadata: Dict[str, Any] = Field(default_factory=dict)
    rules: Optional[NotificationRules] = None
    scheduled_for: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("priority", mode="before")
    def validate_priority(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("Priority must be between 1 and 5")
        return v


class ChannelDeliveryStatus(BaseModel):
    channel_type: str
    status: NotificationStatus
    delivered_at: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int = 0


class NotificationRecord(BaseModel):
    id: str
    user_id: str
    status: NotificationStatus = NotificationStatus.PENDING
    created_at: datetime
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    snoozed_until: Optional[datetime] = None
    archived_at: Optional[datetime] = None
    channels: List[ChannelDeliveryStatus] = Field(default_factory=list)
    original_request: NotificationRequest
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def mark_as_read(self) -> None:
        """Mark notification as read"""
        self.status = NotificationStatus.READ
        self.read_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    def snooze_until(self, until: datetime) -> None:
        """Snooze notification until specified time"""
        self.status = NotificationStatus.SNOOZED
        self.snoozed_until = until
        self.updated_at = datetime.now(timezone.utc)

    def archive(self) -> None:
        """Archive notification"""
        self.status = NotificationStatus.ARCHIVED
        self.archived_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)


class ActionResult(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    next_actions: Optional[List[NotificationAction]] = None
    update_notification: Optional[Dict[str, Any]] = None
    error_code: Optional[str] = None


class BulkActions(str, Enum):
    MARK_READ = "mark_read"
    ARCHIVE = "archive"
    DELETE = "delete"


class UserNotificationPreferences(BaseModel):
    user_id: str
    channel_preferences: Dict[str, Dict[str, Union[bool, int]]] = Field(
        default_factory=dict
    )
    # Format: {source: {channel_type: enabled, priority: int}}
    snooze_settings: Dict[str, Any] = Field(default_factory=dict)
    quiet_hours: Optional[Dict[str, str]] = None  # {'start': '22:00', 'end': '08:00'}
    max_notifications_per_hour: int = 50
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def is_channel_enabled(self, source: str, channel_type: str) -> bool:
        """Check if a channel is enabled for a source"""
        return bool(self.channel_preferences.get(source, {}).get(channel_type, True))

    def is_in_quiet_hours(self) -> bool:
        """Check if current time is in quiet hours"""
        if not self.quiet_hours:
            return False

        now = datetime.now().time()
        start = datetime.strptime(self.quiet_hours["start"], "%H:%M").time()
        end = datetime.strptime(self.quiet_hours["end"], "%H:%M").time()

        if start <= end:
            return start <= now <= end
        else:
            return now >= start or now <= end


# Example notification for email draft scenario
def create_email_draft_notification(
    user_id: str, draft_id: str, original_email_id: str
) -> NotificationRequest:
    """Create notification for AI-drafted email"""
    return NotificationRequest(
        user_id=user_id,
        source="ai-email-draft",
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
