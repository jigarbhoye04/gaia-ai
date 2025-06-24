import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import Request

from app.config.loggers import app_logger as logger

from app.models.notification.notification_models import (
    ActionResult,
    BulkActions,
    ChannelDeliveryStatus,
    NotificationRecord,
    NotificationRequest,
    NotificationStatus,
)
from app.utils.common_utils import websocket_manager
from app.utils.notification.actions import (
    ActionHandler,
    ApiCallActionHandler,
    RedirectActionHandler,
)
from app.utils.notification.channels import (
    ChannelAdapter,
    EmailChannelAdapter,
    InAppChannelAdapter,
)
from app.utils.notification.sources import (
    AIEmailCalendarSource,
    AIEmailDraftSource,
    NotificationSource,
)
from app.utils.notification.storage import (
    MongoDBNotificationStorage,
)


class NotificationOrchestrator:
    """Core notification orchestration engine"""

    def __init__(self, storage=MongoDBNotificationStorage()):
        self.storage = storage
        self.channel_adapters: Dict[str, ChannelAdapter] = {}
        self.action_handlers: Dict[str, ActionHandler] = {}
        self.sources: Dict[str, NotificationSource] = {}

        # Register default components
        self._register_default_components()

    def _register_default_components(self) -> None:
        """Register default adapters, handlers, and sources"""
        # Channel adapters
        self.register_channel_adapter(InAppChannelAdapter())
        self.register_channel_adapter(EmailChannelAdapter())

        # Action handlers
        self.register_action_handler(ApiCallActionHandler())
        self.register_action_handler(RedirectActionHandler())

        # Sources
        self.register_source(AIEmailDraftSource())
        self.register_source(AIEmailCalendarSource())

    def register_channel_adapter(self, adapter: ChannelAdapter) -> None:
        """Register a new channel adapter"""
        self.channel_adapters[adapter.channel_type] = adapter
        logger.info(f"Registered channel adapter: {adapter.channel_type}")

    def register_action_handler(self, handler: ActionHandler) -> None:
        """Register a new action handler"""
        self.action_handlers[handler.action_type] = handler
        logger.info(f"Registered action handler: {handler.action_type}")

    def register_source(self, source: NotificationSource) -> None:
        """Register a new notification source"""
        self.sources[source.source_id] = source
        logger.info(f"Registered notification source: {source.source_id}")

    async def create_notification(
        self, request: NotificationRequest
    ) -> NotificationRecord | None:
        """Create and process a new notification"""
        logger.info(f"Creating notification {request.id} for user {request.user_id}")

        # Check for duplicates if deduplication is enabled
        if request.rules and request.rules.deduplicate_within_minutes:
            is_duplicate = await self._check_duplicate(request)
            if is_duplicate:
                logger.info(f"Notification {request.id} is a duplicate, skipping")
                return None

        # Create notification record
        notification_record = NotificationRecord(
            id=request.id,
            user_id=request.user_id,
            status=NotificationStatus.PENDING,
            created_at=request.created_at,
            original_request=request,
        )

        # Save to storage
        await self.storage.save_notification(notification_record)

        # Schedule delivery
        if request.scheduled_for:
            await self._schedule_delivery(notification_record)
        else:
            await self._deliver_notification(notification_record)

        return notification_record

    async def _check_duplicate(self, request: NotificationRequest) -> bool:
        """Check if this notification is a duplicate within the specified time window"""

        if not request.rules or not request.rules.deduplicate_within_minutes:
            return False

        cutoff_time = datetime.now(timezone.utc) - timedelta(
            minutes=request.rules.deduplicate_within_minutes
        )

        recent_notifications = await self.storage.get_user_notifications(
            request.user_id, status=None, limit=100
        )

        for notification in recent_notifications:
            if (
                notification.created_at >= cutoff_time
                and notification.original_request.source == request.source
                and notification.original_request.content.title == request.content.title
            ):
                return True

        return False

    async def _schedule_delivery(self, notification: NotificationRecord) -> None:
        """Schedule notification for future delivery"""
        if not notification.original_request.scheduled_for:
            logger.warning(
                f"Notification {notification.id} has no scheduled time, delivering immediately"
            )
            await self._deliver_notification(notification)
            return

        delay = (
            notification.original_request.scheduled_for - datetime.now(timezone.utc)
        ).total_seconds()
        if delay > 0:
            asyncio.create_task(self._delayed_delivery(notification, delay))
        else:
            await self._deliver_notification(notification)

    async def _delayed_delivery(
        self, notification: NotificationRecord, delay: float
    ) -> None:
        """Deliver notification after delay"""
        await asyncio.sleep(delay)
        await self._deliver_notification(notification)

    async def _deliver_notification(self, notification: NotificationRecord) -> None:
        """Deliver notification through all configured channels"""
        logger.info(f"Delivering notification {notification.id}")

        delivery_tasks = []
        for channel_config in notification.original_request.channels:
            adapter = self.channel_adapters.get(channel_config.channel_type)
            if adapter and adapter.can_handle(notification.original_request):
                task = self._deliver_via_channel(notification, adapter)
                delivery_tasks.append(task)

        # Execute all deliveries concurrently
        if delivery_tasks:
            delivery_results = await asyncio.gather(
                *delivery_tasks, return_exceptions=True
            )  # Update notification with delivery results
            channel_statuses = []
            for result in delivery_results:
                if isinstance(result, ChannelDeliveryStatus):
                    channel_statuses.append(result)
                elif isinstance(result, Exception):
                    logger.error(f"Delivery failed: {result}")

            # Update the existing notification record instead of saving a new one
            await self.storage.update_notification(
                notification.id,
                {
                    "channels": [status.model_dump() for status in channel_statuses],
                    "status": NotificationStatus.DELIVERED,
                    "delivered_at": datetime.now(timezone.utc),
                },
            )

            # Update the local notification object for broadcasting
            notification.channels = channel_statuses
            notification.status = NotificationStatus.DELIVERED
            notification.delivered_at = datetime.now(timezone.utc)

            # Broadcast real-time update
            await websocket_manager.broadcast_to_user(
                notification.user_id,
                {
                    "type": "notification.delivered",
                    "notification": await self._serialize_notification(notification),
                },
            )

    async def _deliver_via_channel(
        self, notification: NotificationRecord, adapter: ChannelAdapter
    ) -> ChannelDeliveryStatus:
        """Deliver notification via a specific channel"""
        try:
            content = await adapter.transform(notification.original_request)
            return await adapter.deliver(content, notification.user_id)
        except Exception as e:
            logger.error(f"Channel delivery failed: {e}")
            return ChannelDeliveryStatus(
                channel_type=adapter.channel_type,
                status=NotificationStatus.PENDING,
                error_message=str(e),
            )

    async def execute_action(
        self,
        notification_id: str,
        action_id: str,
        user_id: str,
        request: Optional[Request],
    ) -> ActionResult:
        """Execute a notification action"""
        logger.info(f"Executing action {action_id} for notification {notification_id}")

        # Get notification
        notification = await self.storage.get_notification(notification_id, user_id)
        if not notification:
            return ActionResult(
                success=False, message="Notification not found", error_code="NOT_FOUND"
            )

        # Find action
        action = None
        for a in notification.original_request.content.actions or []:
            if a.id == action_id:
                action = a
                break

        if not action:
            return ActionResult(
                success=False, message="Action not found", error_code="ACTION_NOT_FOUND"
            )

        # Get handler
        handler = self.action_handlers.get(action.type.value)
        if not handler or not handler.can_handle(action):
            return ActionResult(
                success=False,
                message=f"No handler available for action type: {action.type}",
                error_code="NO_HANDLER",
            )

        # Execute action
        result = await handler.execute(action, notification, user_id, request=request)

        # Update notification if needed
        if result.update_notification:
            await self.storage.update_notification(
                notification_id, result.update_notification
            )

            # Broadcast update
            await websocket_manager.broadcast_to_user(
                user_id,
                {
                    "type": "notification.updated",
                    "notification_id": notification_id,
                    "updates": result.update_notification,
                },
            )

        # Create follow-up notifications if needed
        if result.next_actions:
            for next_action in result.next_actions:
                # Create new notification with next action
                # Implementation depends on specific requirements
                pass

        return result

    async def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        """Mark notification as read"""
        notification = await self.storage.get_notification(notification_id, user_id)
        if not notification:
            return False

        logger.info(f"{NotificationStatus.READ.value=}")

        await self.storage.update_notification(
            notification_id,
            {
                "status": NotificationStatus.READ.value,
                "read_at": datetime.now(timezone.utc),
            },
        )

        # Broadcast update
        await websocket_manager.broadcast_to_user(
            user_id, {"type": "notification.read", "notification_id": notification_id}
        )

        return True

    async def snooze_notification(
        self, notification_id: str, user_id: str, snooze_until: datetime
    ) -> bool:
        """Snooze notification until specified time"""
        notification = await self.storage.get_notification(notification_id, user_id)
        if not notification:
            return False

        await self.storage.update_notification(
            notification_id,
            {"status": NotificationStatus.SNOOZED, "snoozed_until": snooze_until},
        )

        # Schedule reactivation
        delay = (snooze_until - datetime.now(timezone.utc)).total_seconds()
        if delay > 0:
            asyncio.create_task(
                self._reactivate_snoozed_notification(notification_id, delay)
            )

        return True

    async def _reactivate_snoozed_notification(
        self, notification_id: str, delay: float
    ) -> None:
        """Reactivate snoozed notification after delay"""
        await asyncio.sleep(delay)

        # Get current notification state
        notification = await self.storage.get_notification(
            notification_id, None
        )  # Skip user check for internal use
        if notification and notification.status == NotificationStatus.SNOOZED:
            await self.storage.update_notification(
                notification_id,
                {"status": NotificationStatus.DELIVERED, "snoozed_until": None},
            )

            # Broadcast reactivation
            await websocket_manager.broadcast_to_user(
                notification.user_id,
                {
                    "type": "notification.reactivated",
                    "notification_id": notification_id,
                },
            )

    async def get_user_notifications(
        self,
        user_id: str,
        status: Optional[NotificationStatus] = None,
        limit: int = 50,
        offset: int = 0,
        channel_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get notifications for a user with optional status and channel filtering"""
        notifications = await self.storage.get_user_notifications(
            user_id, status, limit, offset, channel_type
        )
        return [await self._serialize_notification(n) for n in notifications]

    async def get_notification(
        self, notification_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get a specific notification by ID for a user"""
        notification = await self.storage.get_notification(notification_id, user_id)
        if not notification:
            return None
        return await self._serialize_notification(notification)

    async def bulk_actions(
        self, notification_ids: List[str], user_id: str, action: BulkActions
    ) -> Dict[str, bool]:
        """Perform bulk actions on multiple notifications"""
        results = {}

        for notification_id in notification_ids:
            try:
                if action == BulkActions.MARK_READ:
                    success = await self.mark_as_read(notification_id, user_id)
                elif action == BulkActions.ARCHIVE:
                    success = await self.archive_notification(notification_id, user_id)
                else:
                    success = False

                results[notification_id] = success
            except Exception as e:
                logger.error(f"Bulk action failed for {notification_id}: {e}")
                results[notification_id] = False

        return results

    async def archive_notification(self, notification_id: str, user_id: str) -> bool:
        """Archive a notification"""
        notification = await self.storage.get_notification(notification_id, user_id)
        if not notification:
            return False

        await self.storage.update_notification(
            notification_id,
            {
                "status": NotificationStatus.ARCHIVED,
                "archived_at": datetime.now(timezone.utc),
            },
        )

        return True

    async def _serialize_notification(
        self, notification: NotificationRecord
    ) -> Dict[str, Any]:
        """Serialize notification for API response"""
        return {
            "id": notification.id,
            "user_id": notification.user_id,
            "status": notification.status.value,
            "created_at": notification.created_at.isoformat(),
            "delivered_at": (
                notification.delivered_at.isoformat()
                if notification.delivered_at
                else None
            ),
            "read_at": (
                notification.read_at.isoformat() if notification.read_at else None
            ),
            "snoozed_until": (
                notification.snoozed_until.isoformat()
                if notification.snoozed_until
                else None
            ),
            "content": {
                "title": notification.original_request.content.title,
                "body": notification.original_request.content.body,
                "actions": [
                    {
                        "id": action.id,
                        "type": action.type.value,
                        "label": action.label,
                        "style": action.style.value,
                        "requires_confirmation": action.requires_confirmation,
                        "confirmation_message": action.confirmation_message,
                    }
                    for action in (notification.original_request.content.actions or [])
                ],
            },
            "metadata": notification.original_request.metadata,
            "channels": [
                {
                    "channel_type": ch.channel_type,
                    "status": ch.status.value,
                    "delivered_at": (
                        ch.delivered_at.isoformat() if ch.delivered_at else None
                    ),
                    "error_message": ch.error_message,
                }
                for ch in notification.channels
            ],
        }
