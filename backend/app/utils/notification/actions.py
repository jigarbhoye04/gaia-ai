import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import Request

from app.config.loggers import notification_logger
from app.models.notification.notification_models import (
    ActionResult,
    ActionType,
    NotificationAction,
    NotificationRecord,
    NotificationStatus,
)


class ActionHandler(ABC):
    """Base class for all action handlers"""

    @property
    @abstractmethod
    def action_type(self) -> str:
        pass

    @abstractmethod
    def can_handle(self, action: NotificationAction) -> bool:
        pass

    @abstractmethod
    async def execute(
        self,
        action: NotificationAction,
        notification: NotificationRecord,
        user_id: str,
        request: Optional[Request],
    ) -> ActionResult:
        pass


# Action Handlers
class ApiCallActionHandler(ActionHandler):
    """Handler for API call actions"""

    @property
    def action_type(self) -> str:
        return "api_call"

    def can_handle(self, action: NotificationAction) -> bool:
        return action.type == ActionType.API_CALL and action.config.api_call is not None

    async def execute(
        self,
        action: NotificationAction,
        notification: NotificationRecord,
        user_id: str,
        request: Optional[Request],
    ) -> ActionResult:
        api_config = action.config.api_call

        if api_config is None:
            logging.error(
                f"API call configuration missing for action {action.id} in notification {notification.id}"
            )
            return ActionResult(
                success=False,
                message="API call configuration is missing",
                error_code="CONFIG_ERROR",
            )

        try:
            # Prepare headers with authentication
            headers = {
                "Content-Type": "application/json",
                "X-User-ID": user_id,
                "X-Notification-ID": notification.id,
                **(api_config.headers or {}),
            }

            # Prepare payload with context
            payload = {
                **(api_config.payload or {}),
                "user_id": user_id,
                "notification_id": notification.id,
                "action_id": action.id,
                "metadata": notification.original_request.metadata,
            }

            url = api_config.endpoint
            if api_config.is_internal:
                # For internal API calls, use the request's base URL
                if request:
                    url = f"{request.base_url}{api_config.endpoint.lstrip('/')}"

            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method=api_config.method,
                    url=url,
                    headers=headers,
                    json=payload,
                    timeout=30.0,
                    cookies=(
                        request.cookies if request and api_config.is_internal else None
                    ),
                )

                response.raise_for_status()
                result_data = response.json() if response.content else {}

                return ActionResult(
                    success=True,
                    message=api_config.success_message
                    or "Action completed successfully",
                    data=result_data,
                    update_notification={
                        "status": NotificationStatus.ARCHIVED,
                        "metadata": {
                            **notification.original_request.metadata,
                            "actions_executed": [
                                *(
                                    notification.original_request.metadata.get(
                                        "actions_executed", []
                                    )
                                ),
                                {
                                    "id": action.id,
                                    "result": result_data,
                                    "executed_at": datetime.now(
                                        timezone.utc
                                    ).isoformat(),
                                },
                            ],
                        },
                    },
                )

        except httpx.HTTPError as e:
            notification_logger.error(
                f"Unexpected error in API call action {action.id} for notification {notification.id}: {str(e)}",
            )
            return ActionResult(
                success=False,
                message=api_config.error_message or f"API call failed: {str(e)}",
                error_code="API_ERROR",
            )
        except Exception as e:
            notification_logger.error(
                f"Unexpected error in API call action {action.id} for notification {notification.id}: {str(e)}",
            )
            return ActionResult(
                success=False,
                message=api_config.error_message or f"Unexpected error: {str(e)}",
                error_code="UNKNOWN_ERROR",
            )


class RedirectActionHandler(ActionHandler):
    """Handler for redirect actions (client-side)"""

    @property
    def action_type(self) -> str:
        return "redirect"

    def can_handle(self, action: NotificationAction) -> bool:
        return action.type == ActionType.REDIRECT and action.config.redirect is not None

    async def execute(
        self,
        action: NotificationAction,
        notification: NotificationRecord,
        user_id: str,
        request: Optional[Request],
    ) -> ActionResult:
        redirect_config = action.config.redirect

        if redirect_config is None:
            logging.error(
                f"Redirect configuration missing for action {action.id} in notification {notification.id}"
            )
            return ActionResult(
                success=False,
                message="Redirect configuration is missing",
                error_code="CONFIG_ERROR",
            )

        return ActionResult(
            success=True,
            message="Redirecting...",
            data={
                "redirect_url": redirect_config.url,
                "open_in_new_tab": redirect_config.open_in_new_tab,
            },
            update_notification={
                "status": (
                    NotificationStatus.READ
                    if redirect_config.close_notification
                    else None
                )
            },
        )
