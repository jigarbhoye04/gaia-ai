from abc import ABC, abstractmethod
from typing import Any, Dict, List

from app.models.notification.notification_models import (
    NotificationRequest,
    create_email_draft_notification,
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
