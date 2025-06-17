"""
Reminder models for task scheduling system.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class ReminderStatus(str, Enum):
    """Status of a reminder."""

    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class ReminderType(str, Enum):
    """Type of reminder tasks."""

    DAILY_QUOTE = "daily_quote"
    WEATHER_UPDATE = "weather_update"
    CALENDAR_REMINDER = "calendar_reminder"
    TASK_REMINDER = "task_reminder"
    CUSTOM_NOTIFICATION = "custom_notification"
    GOAL_CHECKIN = "goal_checkin"


class ReminderModel(BaseModel):
    """
    Reminder document model for MongoDB.

    Represents a scheduled task that can be one-time or recurring.
    """

    id: Optional[str] = Field(None, alias="_id")
    user_id: str = Field(..., description="User ID who owns this reminder")
    type: ReminderType = Field(..., description="Type of reminder task")
    repeat: Optional[str] = Field(
        None, description="Cron expression for recurring tasks"
    )
    scheduled_at: datetime = Field(..., description="Next scheduled execution time")
    status: ReminderStatus = Field(
        default=ReminderStatus.SCHEDULED, description="Current status"
    )
    occurrence_count: int = Field(
        default=0, description="Number of times this reminder has been executed"
    )
    max_occurrences: Optional[int] = Field(
        None, description="Maximum number of executions (optional)"
    )
    stop_after: Optional[datetime] = Field(
        None, description="Stop executing after this date (optional)"
    )
    payload: Dict[str, Any] = Field(
        default_factory=dict, description="Task-specific data"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Creation timestamp"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Last update timestamp"
    )

    class Config:
        """Pydantic configuration."""

        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}


class CreateReminderRequest(BaseModel):
    """Request model for creating a new reminder."""

    user_id: str = Field(..., description="User ID who owns this reminder")
    type: ReminderType = Field(..., description="Type of reminder task")
    repeat: Optional[str] = Field(
        None, description="Cron expression for recurring tasks (optional)"
    )
    scheduled_at: Optional[datetime] = Field(
        None, description="First execution time (optional, defaults to now)"
    )
    max_occurrences: Optional[int] = Field(
        None, description="Maximum number of executions (optional)"
    )
    stop_after: Optional[datetime] = Field(
        None, description="Stop executing after this date (optional)"
    )
    payload: Dict[str, Any] = Field(
        default_factory=dict, description="Task-specific data"
    )


class UpdateReminderRequest(BaseModel):
    """Request model for updating an existing reminder."""

    type: Optional[ReminderType] = Field(None, description="Type of reminder task")
    repeat: Optional[str] = Field(
        None, description="Cron expression for recurring tasks"
    )
    scheduled_at: Optional[datetime] = Field(None, description="Next execution time")
    status: Optional[ReminderStatus] = Field(None, description="Current status")
    max_occurrences: Optional[int] = Field(
        None, description="Maximum number of executions"
    )
    stop_after: Optional[datetime] = Field(
        None, description="Stop executing after this date"
    )
    payload: Optional[Dict[str, Any]] = Field(None, description="Task-specific data")


class ReminderResponse(BaseModel):
    """Response model for reminder operations."""

    id: str = Field(..., description="Reminder ID")
    user_id: str = Field(..., description="User ID who owns this reminder")
    type: ReminderType = Field(..., description="Type of reminder task")
    repeat: Optional[str] = Field(
        None, description="Cron expression for recurring tasks"
    )
    scheduled_at: datetime = Field(..., description="Next scheduled execution time")
    status: ReminderStatus = Field(..., description="Current status")
    occurrence_count: int = Field(
        ..., description="Number of times this reminder has been executed"
    )
    max_occurrences: Optional[int] = Field(
        None, description="Maximum number of executions"
    )
    stop_after: Optional[datetime] = Field(
        None, description="Stop executing after this date"
    )
    payload: Dict[str, Any] = Field(..., description="Task-specific data")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
