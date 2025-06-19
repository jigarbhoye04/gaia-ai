"""
Reminder models for task scheduling system.
"""

from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Dict, Optional, Union

from pydantic import BaseModel, Field, field_validator


class ReminderStatus(str, Enum):
    """Status of a reminder."""

    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class AgentType(str, Enum):
    """Agent type handling the reminder task."""

    STATIC = "static"
    AI_AGENTS = "ai_agents"


class StaticReminderPayload(BaseModel):
    """Payload for STATIC agent reminders."""

    title: str = Field(..., description="Notification title")
    body: str = Field(..., description="Notification body")


class AIAgentReminderPayload(BaseModel):
    """Payload for AI_AGENTS reminders."""

    instructions: str = Field(
        ..., description="Special instructions for reminder generation"
    )


class ReminderModel(BaseModel):
    """
    Reminder document model for MongoDB.

    Represents a scheduled task that can be one-time or recurring.
    """

    id: Optional[str] = Field(None, alias="_id")
    user_id: str = Field(..., description="User ID who owns this reminder")
    agent: AgentType = Field(
        ..., description="Agent responsible for this reminder task"
    )
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
        default=datetime.now(timezone.utc) + timedelta(days=180),
        description="Stop executing after this date (optional), defaults to 6 months from now",
    )
    payload: Union[StaticReminderPayload, AIAgentReminderPayload, Dict[str, Any]] = (
        Field(..., description="Task-specific data based on agent type")
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Creation timestamp",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Last update timestamp",
    )

    class Config:
        """Pydantic configuration."""

        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}


class CreateReminderRequest(BaseModel):
    """Request model for creating a new reminder."""

    agent: AgentType = Field(
        ..., description="Agent handling the reminder task (static or ai_agents)"
    )
    repeat: Optional[str] = Field(
        None, description="Cron expression for recurring tasks (optional)"
    )
    scheduled_at: Optional[datetime] = Field(
        None, description="First execution time (optional, defaults to None)"
    )
    max_occurrences: Optional[int] = Field(
        None, description="Maximum number of executions (optional)"
    )
    stop_after: Optional[datetime] = Field(
        None, description="Stop executing after this date (optional)"
    )
    payload: Union[StaticReminderPayload, AIAgentReminderPayload] = Field(
        ..., description="Task-specific data based on agent type"
    )
    base_time: Optional[datetime] = Field(
        None,
        description="Base time for handling time zones and scheduling (optional, defaults to None)",
    )

    @field_validator("repeat")
    def check_repeat_cron(cls, v):
        from app.utils.cron_utils import validate_cron_expression

        if v is not None and not validate_cron_expression(v):
            raise ValueError(f"Invalid cron expression: {v}")
        return v

    @field_validator("max_occurrences")
    def check_max_occurrences(cls, v):
        if v is not None and v <= 0:
            raise ValueError("max_occurrences must be greater than 0")
        return v

    @field_validator("stop_after")
    def check_stop_after_future(cls, v):
        from datetime import datetime

        if v is not None and v <= datetime.now(timezone.utc):
            raise ValueError("stop_after must be in the future")
        return v


class UpdateReminderRequest(BaseModel):
    """Request model for updating an existing reminder."""

    agent: Optional[AgentType] = Field(
        None, description="Agent handling the reminder task (optional)"
    )
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
    payload: Optional[Union[StaticReminderPayload, AIAgentReminderPayload]] = Field(
        None, description="Task-specific data (optional)"
    )

    @field_validator("repeat")
    def check_repeat_cron(cls, v):
        from app.utils.cron_utils import validate_cron_expression

        if v is not None and not validate_cron_expression(v):
            raise ValueError(f"Invalid cron expression: {v}")
        return v

    @field_validator("max_occurrences")
    def check_max_occurrences(cls, v):
        if v is not None and v <= 0:
            raise ValueError("max_occurrences must be greater than 0")
        return v

    @field_validator("stop_after")
    def check_stop_after_future(cls, v):
        from datetime import datetime

        if v is not None and v <= datetime.now(timezone.utc):
            raise ValueError("stop_after must be in the future")
        return v


class ReminderResponse(BaseModel):
    """Response model for reminder operations."""

    id: str = Field(..., description="Reminder ID")
    user_id: str = Field(..., description="User ID who owns this reminder")
    agent: AgentType = Field(
        ..., description="Agent responsible for this reminder task"
    )
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
    payload: Union[StaticReminderPayload, AIAgentReminderPayload, Dict[str, Any]] = (
        Field(..., description="Task-specific data")
    )
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class ReminderProcessingAgentResult(BaseModel):
    """Result model for reminder processing by AI agents."""

    title: str = Field(..., description="Title of notification")
    body: str = Field(..., description="Body of notification")
