import asyncio
from datetime import datetime, timezone
from typing import Optional

from fastapi import (
    APIRouter,
    Body,
    Depends,
    HTTPException,
    Path,
    Query,
)

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.config.loggers import notification_logger as logger
from app.models.notification.notification_models import (
    NotificationStatus,
)
from app.models.notification.request_models import (
    BulkActionRequest,
    ExecuteActionRequest,
    NotificationResponse,
    PaginatedNotificationsResponse,
    SnoozeRequest,
)
from app.services.notification_service import NotificationService

# Initialize notification service
notification_service = NotificationService()

router = APIRouter()


@router.get("/notifications", response_model=PaginatedNotificationsResponse)
async def get_notifications(
    status: Optional[NotificationStatus] = Query(None, description="Filter by status"),
    limit: int = Query(
        50, ge=1, le=100, description="Number of notifications to return"
    ),
    offset: int = Query(0, ge=0, description="Number of notifications to skip"),
    current_user: dict = Depends(get_current_user),
):
    """Get user's notifications with pagination"""
    user_id = current_user.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=401, detail="User not authenticated or user_id not found"
        )

    try:
        notifications, notification_count = await asyncio.gather(
            notification_service.get_user_notifications(
                user_id, status, limit + 1, offset
            ),
            notification_service.get_user_notifications_count(user_id, status),
        )

        return PaginatedNotificationsResponse(
            notifications=notifications,
            total=notification_count,  # In a real implementation, you'd get actual total count
            limit=limit,
            offset=offset,
        )

    except Exception as e:
        logger.error(f"Failed to get notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notifications/{notification_id}")
async def get_notification(
    notification_id: str = Path(..., description="Notification ID"),
    current_user: dict = Depends(get_current_user),
):
    """Get a specific notification"""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=401, detail="User not authenticated or user_id not found"
        )

    try:
        notification = await notification_service.get_notification(
            notification_id, user_id
        )
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")

        return NotificationResponse(
            success=True,
            message="Notification retrieved successfully",
            data=notification,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notifications/{notification_id}/actions/{action_id}/execute")
async def execute_action(
    notification_id: str = Path(..., description="Notification ID"),
    action_id: str = Path(..., description="Action ID"),
    request: ExecuteActionRequest = Body(default=ExecuteActionRequest()),
    current_user: dict = Depends(get_current_user),
):
    """Execute a notification action"""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=401, detail="User not authenticated or user_id not found"
        )

    try:

        result = await notification_service.execute_action(
            notification_id, action_id, user_id
        )

        if not result.success:
            raise HTTPException(status_code=400, detail=result.message)

        return NotificationResponse(
            success=True,
            message=result.message or "Action executed successfully",
            data=result.data,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to execute action: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notifications/{notification_id}/read")
async def mark_as_read(
    notification_id: str = Path(..., description="Notification ID"),
    current_user: dict = Depends(get_current_user),
):
    """Mark notification as read"""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=401, detail="User not authenticated or user_id not found"
        )

    try:

        success = await notification_service.mark_as_read(notification_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")

        return NotificationResponse(success=True, message="Notification marked as read")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to mark notification as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notifications/{notification_id}/snooze")
async def snooze_notification(
    notification_id: str = Path(..., description="Notification ID"),
    request: SnoozeRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    """Snooze notification until specified time"""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=401, detail="User not authenticated or user_id not found"
        )

    try:

        if request.snooze_until <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400, detail="Snooze time must be in the future"
            )

        success = await notification_service.snooze_notification(
            notification_id, user_id, request.snooze_until
        )
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")

        return NotificationResponse(
            success=True,
            message=f"Notification snoozed until {request.snooze_until.isoformat()}",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to snooze notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notifications/bulk-actions")
async def bulk_actions(
    request: BulkActionRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    """Perform bulk actions on multiple notifications"""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=401, detail="User not authenticated or user_id not found"
        )

    try:

        if not request.notification_ids:
            raise HTTPException(status_code=400, detail="No notification IDs provided")

        results = await notification_service.bulk_actions(
            request.notification_ids, user_id, request.action
        )

        successful = sum(1 for success in results.values() if success)
        total = len(results)

        return NotificationResponse(
            success=True,
            message=f"Bulk action completed: {successful}/{total} successful",
            data={"results": results, "successful": successful, "total": total},
        )

    except Exception as e:
        logger.error(f"Failed to perform bulk actions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
