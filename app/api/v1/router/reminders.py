"""
FastAPI endpoints for reminder management.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi import status as http_status
from pydantic import ValidationError

from app.config.loggers import general_logger as logger
from app.models.reminder_models import (
    CreateReminderRequest,
    ReminderResponse,
    ReminderStatus,
    ReminderType,
    UpdateReminderRequest,
)
from app.services.scheduler import (
    cancel_reminder,
    create_reminder,
    get_reminder,
    list_user_reminders,
    update_reminder,
)
from app.utils.cron import get_next_run_time, validate_cron_expression

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.post(
    "/", response_model=ReminderResponse, status_code=http_status.HTTP_201_CREATED
)
async def create_reminder_endpoint(request: CreateReminderRequest):
    """
    Create a new reminder.

    Args:
        request: Reminder creation request

    Returns:
        Created reminder details

    Raises:
        HTTPException: If validation fails or creation errors occur
    """
    try:
        # Validate cron expression if provided
        if request.repeat and not validate_cron_expression(request.repeat):
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid cron expression: {request.repeat}",
            )

        # Validate max_occurrences
        if request.max_occurrences is not None and request.max_occurrences <= 0:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="max_occurrences must be greater than 0",
            )

        # Validate stop_after date
        if request.stop_after and request.stop_after <= datetime.utcnow():
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="stop_after must be in the future",
            )

        # Create reminder
        reminder_data = request.model_dump(exclude_none=True)
        reminder_id = await create_reminder(reminder_data)

        # Get created reminder to return
        reminder = await get_reminder(reminder_id)
        if not reminder:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve created reminder",
            )

        return ReminderResponse(**reminder.model_dump())

    except ValidationError as e:
        logger.error(f"Validation error creating reminder: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Validation error: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Error creating reminder: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create reminder",
        )


@router.get("/{reminder_id}", response_model=ReminderResponse)
async def get_reminder_endpoint(reminder_id: str):
    """
    Get a reminder by ID.

    Args:
        reminder_id: Reminder ID

    Returns:
        Reminder details

    Raises:
        HTTPException: If reminder not found
    """
    try:
        reminder = await get_reminder(reminder_id)

        if not reminder:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Reminder {reminder_id} not found",
            )

        return ReminderResponse(**reminder.model_dump())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting reminder {reminder_id}: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve reminder",
        )


@router.put("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder_endpoint(reminder_id: str, request: UpdateReminderRequest):
    """
    Update an existing reminder.

    Args:
        reminder_id: Reminder ID
        request: Reminder update request

    Returns:
        Updated reminder details

    Raises:
        HTTPException: If reminder not found or validation fails
    """
    try:
        # Validate cron expression if provided
        if request.repeat and not validate_cron_expression(request.repeat):
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid cron expression: {request.repeat}",
            )

        # Validate max_occurrences
        if request.max_occurrences is not None and request.max_occurrences <= 0:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="max_occurrences must be greater than 0",
            )

        # Validate stop_after date
        if request.stop_after and request.stop_after <= datetime.utcnow():
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="stop_after must be in the future",
            )

        # Check if reminder exists
        existing_reminder = await get_reminder(reminder_id)
        if not existing_reminder:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Reminder {reminder_id} not found",
            )

        # Update reminder
        update_data = request.model_dump(exclude_none=True)
        success = await update_reminder(reminder_id, update_data)

        if not success:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update reminder",
            )

        # Get updated reminder
        updated_reminder = await get_reminder(reminder_id)
        if not updated_reminder:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve updated reminder",
            )

        return ReminderResponse(**updated_reminder.model_dump())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating reminder {reminder_id}: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update reminder",
        )


@router.delete("/{reminder_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def cancel_reminder_endpoint(reminder_id: str):
    """
    Cancel a reminder.

    Args:
        reminder_id: Reminder ID

    Raises:
        HTTPException: If reminder not found
    """
    try:
        # Check if reminder exists
        existing_reminder = await get_reminder(reminder_id)
        if not existing_reminder:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Reminder {reminder_id} not found",
            )

        success = await cancel_reminder(reminder_id)

        if not success:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to cancel reminder",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling reminder {reminder_id}: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel reminder",
        )


@router.get("/", response_model=List[ReminderResponse])
async def list_reminders_endpoint(
    user_id: str = Query(..., description="User ID to filter reminders"),
    status: Optional[ReminderStatus] = Query(None, description="Filter by status"),
    reminder_type: Optional[ReminderType] = Query(
        None, description="Filter by type", alias="type"
    ),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    skip: int = Query(0, ge=0, description="Number of results to skip"),
):
    """
    List reminders for a user.

    Args:
        user_id: User ID to filter by
        status: Optional status filter
        reminder_type: Optional type filter
        limit: Maximum number of results
        skip: Number of results to skip

    Returns:
        List of reminders
    """
    try:
        reminders = await list_user_reminders(
            user_id=user_id, status=status, limit=limit, skip=skip
        )

        # Apply type filter if provided (client-side filtering for now)
        if reminder_type:
            reminders = [r for r in reminders if r.type == reminder_type]

        return [ReminderResponse(**reminder.model_dump()) for reminder in reminders]

    except Exception as e:
        logger.error(f"Error listing reminders for user {user_id}: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list reminders",
        )


@router.post("/{reminder_id}/pause", response_model=ReminderResponse)
async def pause_reminder_endpoint(reminder_id: str):
    """
    Pause a reminder.

    Args:
        reminder_id: Reminder ID

    Returns:
        Updated reminder details

    Raises:
        HTTPException: If reminder not found
    """
    try:
        # Check if reminder exists
        existing_reminder = await get_reminder(reminder_id)
        if not existing_reminder:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Reminder {reminder_id} not found",
            )

        # Update status to paused
        success = await update_reminder(reminder_id, {"status": ReminderStatus.PAUSED})

        if not success:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to pause reminder",
            )

        # Get updated reminder
        updated_reminder = await get_reminder(reminder_id)
        if not updated_reminder:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve updated reminder",
            )

        return ReminderResponse(**updated_reminder.model_dump())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error pausing reminder {reminder_id}: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to pause reminder",
        )


@router.post("/{reminder_id}/resume", response_model=ReminderResponse)
async def resume_reminder_endpoint(reminder_id: str):
    """
    Resume a paused reminder.

    Args:
        reminder_id: Reminder ID

    Returns:
        Updated reminder details

    Raises:
        HTTPException: If reminder not found
    """
    try:
        # Check if reminder exists and is paused
        existing_reminder = await get_reminder(reminder_id)
        if not existing_reminder:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Reminder {reminder_id} not found",
            )

        if existing_reminder.status != ReminderStatus.PAUSED:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Reminder {reminder_id} is not paused (current status: {existing_reminder.status})",
            )

        # Update status to scheduled and reschedule if needed
        update_data: dict = {"status": ReminderStatus.SCHEDULED}

        # If it's a recurring reminder, calculate next run time
        if existing_reminder.repeat:
            next_run = get_next_run_time(existing_reminder.repeat)
            update_data["scheduled_at"] = next_run

        success = await update_reminder(reminder_id, update_data)

        if not success:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to resume reminder",
            )

        # Get updated reminder
        updated_reminder = await get_reminder(reminder_id)
        if not updated_reminder:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve updated reminder",
            )

        return ReminderResponse(**updated_reminder.model_dump())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resuming reminder {reminder_id}: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resume reminder",
        )


@router.get("/types", response_model=List[str])
async def get_reminder_types_endpoint():
    """
    Get available reminder types.

    Returns:
        List of available reminder types
    """
    return [reminder_type.value for reminder_type in ReminderType]


@router.get("/cron/validate")
async def validate_cron_endpoint(
    expression: str = Query(..., description="Cron expression to validate")
):
    """
    Validate a cron expression.

    Args:
        expression: Cron expression to validate

    Returns:
        Validation result
    """
    try:
        is_valid = validate_cron_expression(expression)

        result = {"expression": expression, "valid": is_valid}

        if is_valid:
            # Get next few run times as examples
            from app.utils.cron import calculate_next_occurrences

            next_runs = calculate_next_occurrences(expression, 5)
            result["next_runs"] = [run.isoformat() for run in next_runs]

        return result

    except Exception as e:
        logger.error(f"Error validating cron expression {expression}: {e}")
        return {"expression": expression, "valid": False, "error": str(e)}
