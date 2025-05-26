from datetime import datetime
from typing import List, Optional
from enum import Enum

from pydantic import BaseModel, Field


class Priority(str, Enum):
    HIGH = "high"  # red
    MEDIUM = "medium"  # yellow
    LOW = "low"  # blue
    NONE = "none"  # no color


class SubTask(BaseModel):
    id: str = Field(default="", description="Unique identifier for the subtask")
    title: str = Field(..., description="Title of the subtask")
    completed: bool = Field(default=False, description="Whether the subtask is completed")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TodoModel(BaseModel):
    title: str = Field(
        ..., min_length=1, max_length=200, description="Title of the todo item"
    )
    description: Optional[str] = Field(
        None, max_length=2000, description="Description of the todo item"
    )
    labels: List[str] = Field(
        default_factory=list, max_items=10, description="Labels for categorization"
    )
    due_date: Optional[datetime] = Field(None, description="Due date for the todo item")
    due_date_timezone: Optional[str] = Field(
        None, description="Timezone for the due date (e.g., 'America/New_York')"
    )
    priority: Priority = Field(default=Priority.NONE, description="Priority level")
    project_id: Optional[str] = Field(
        None, description="Project ID the todo belongs to"
    )
    completed: bool = Field(default=False, description="Whether the todo is completed")
    subtasks: List[SubTask] = Field(
        default_factory=list, max_items=50, description="List of subtasks"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TodoCreate(BaseModel):
    title: str = Field(
        ..., min_length=1, max_length=200, description="Title of the todo item"
    )
    description: Optional[str] = Field(
        None, max_length=2000, description="Description of the todo item"
    )
    labels: List[str] = Field(
        default_factory=list, max_items=10, description="Labels for categorization"
    )
    due_date: Optional[datetime] = Field(None, description="Due date for the todo item")
    due_date_timezone: Optional[str] = Field(
        None, description="Timezone for the due date (e.g., 'America/New_York')"
    )
    priority: Priority = Field(default=Priority.NONE, description="Priority level")
    project_id: Optional[str] = Field(
        None, description="Project ID the todo belongs to"
    )


class UpdateTodoRequest(BaseModel):
    title: Optional[str] = Field(
        None, min_length=1, max_length=200, description="Title of the todo item"
    )
    description: Optional[str] = Field(
        None, max_length=2000, description="Description of the todo item"
    )
    labels: Optional[List[str]] = Field(
        None, max_items=10, description="Labels for categorization"
    )
    due_date: Optional[datetime] = Field(None, description="Due date for the todo item")
    due_date_timezone: Optional[str] = Field(
        None, description="Timezone for the due date (e.g., 'America/New_York')"
    )
    priority: Optional[Priority] = Field(None, description="Priority level")
    project_id: Optional[str] = Field(None, description="Project ID the todo belongs to")
    completed: Optional[bool] = Field(None, description="Whether the todo is completed")
    subtasks: Optional[List[SubTask]] = Field(
        None, max_items=50, description="List of subtasks"
    )


class TodoResponse(BaseModel):
    id: str = Field(..., description="Unique identifier")
    user_id: str = Field(..., description="User ID who owns the todo")
    title: str = Field(..., description="Title of the todo item")
    description: Optional[str] = Field(None, description="Description of the todo item")
    labels: List[str] = Field(default_factory=list, description="Labels for categorization")
    due_date: Optional[datetime] = Field(None, description="Due date for the todo item")
    due_date_timezone: Optional[str] = Field(
        None, description="Timezone for the due date (e.g., 'America/New_York')"
    )
    priority: Priority = Field(default=Priority.NONE, description="Priority level")
    project_id: str = Field(..., description="Project ID the todo belongs to")
    completed: bool = Field(default=False, description="Whether the todo is completed")
    subtasks: List[SubTask] = Field(default_factory=list, description="List of subtasks")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class ProjectModel(BaseModel):
    name: str = Field(
        ..., min_length=1, max_length=100, description="Name of the project"
    )
    description: Optional[str] = Field(
        None, max_length=500, description="Description of the project"
    )
    color: Optional[str] = Field(
        None,
        pattern="^#[0-9A-Fa-f]{6}$",
        description="Color code for the project in hex format",
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ProjectCreate(BaseModel):
    name: str = Field(
        ..., min_length=1, max_length=100, description="Name of the project"
    )
    description: Optional[str] = Field(
        None, max_length=500, description="Description of the project"
    )
    color: Optional[str] = Field(
        None,
        pattern="^#[0-9A-Fa-f]{6}$",
        description="Color code for the project in hex format",
    )


class UpdateProjectRequest(BaseModel):
    name: Optional[str] = Field(
        None, min_length=1, max_length=100, description="Name of the project"
    )
    description: Optional[str] = Field(
        None, max_length=500, description="Description of the project"
    )
    color: Optional[str] = Field(
        None,
        pattern="^#[0-9A-Fa-f]{6}$",
        description="Color code for the project in hex format",
    )


class ProjectResponse(BaseModel):
    id: str = Field(..., description="Unique identifier")
    user_id: str = Field(..., description="User ID who owns the project")
    name: str = Field(..., description="Name of the project")
    description: Optional[str] = Field(None, description="Description of the project")
    color: Optional[str] = Field(None, description="Color code for the project")
    is_default: bool = Field(default=False, description="Whether this is the default Inbox project")
    todo_count: int = Field(default=0, description="Number of todos in this project")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

class SubtaskCreateRequest(BaseModel):
    title: str

class SubtaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
