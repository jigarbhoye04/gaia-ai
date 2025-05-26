from typing import List, Optional

from fastapi import APIRouter, Depends, status, HTTPException

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.models.todo_models import (
    SubtaskCreateRequest,
    SubtaskUpdateRequest,
    TodoCreate,
    TodoResponse,
    UpdateTodoRequest,
    ProjectCreate,
    ProjectResponse,
    UpdateProjectRequest,
    Priority
)
from app.services.todo_service import (
    create_todo,
    get_todo,
    get_all_todos,
    update_todo,
    delete_todo,
    create_project,
    get_all_projects,
    update_project,
    delete_project
)
from app.services.todo_bulk_service import (
    bulk_complete_todos,
    bulk_move_todos,
    bulk_delete_todos
)

router = APIRouter()


# Todo endpoints
@router.post("/todos", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
async def create_todo_endpoint(
    todo: TodoCreate,
    user: dict = Depends(get_current_user)
):
    """Create a new todo item."""
    return await create_todo(todo, user["user_id"])


# Search and statistics endpoints - MUST be before /{todo_id} to avoid matching
@router.get("/todos/search", response_model=List[TodoResponse])
async def search_todos_endpoint(
    q: str,
    user: dict = Depends(get_current_user)
):
    """
    Search todos by title, description, or labels.
    
    Query Parameters:
    - q: Search query string
    """
    from app.services.todo_service import search_todos
    return await search_todos(q, user["user_id"])


@router.get("/todos/stats")
async def get_todo_stats_endpoint(
    user: dict = Depends(get_current_user)
):
    """Get statistics about user's todos."""
    from app.services.todo_service import get_todo_stats
    return await get_todo_stats(user["user_id"])


@router.get("/todos/today", response_model=List[TodoResponse])
async def get_today_todos_endpoint(
    user: dict = Depends(get_current_user)
):
    """Get todos due today."""
    from datetime import datetime, time
    today_start = datetime.combine(datetime.today(), time.min)
    today_end = datetime.combine(datetime.today(), time.max)
    
    from app.services.todo_service import get_todos_by_date_range
    return await get_todos_by_date_range(user["user_id"], today_start, today_end)


@router.get("/todos/upcoming", response_model=List[TodoResponse])
async def get_upcoming_todos_endpoint(
    days: int = 7,
    user: dict = Depends(get_current_user)
):
    """
    Get todos due in the upcoming days.
    
    Query Parameters:
    - days: Number of days to look ahead (default: 7)
    """
    from datetime import datetime, timedelta
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=days)
    
    from app.services.todo_service import get_todos_by_date_range
    return await get_todos_by_date_range(user["user_id"], start_date, end_date)


@router.get("/todos/labels")
async def get_all_labels_endpoint(
    user: dict = Depends(get_current_user)
):
    """
    Get all unique labels used by the user.
    
    Returns:
        List of label objects with name and count
    """
    from app.services.todo_service import get_all_labels
    return await get_all_labels(user["user_id"])


@router.get("/todos/by-label/{label}", response_model=List[TodoResponse])
async def get_todos_by_label_endpoint(
    label: str,
    user: dict = Depends(get_current_user)
):
    """
    Get all todos that have a specific label.
    
    Args:
        label: The label to filter by
    
    Returns:
        List of todos with the specified label
    """
    from app.services.todo_service import get_todos_by_label
    return await get_todos_by_label(user["user_id"], label)


@router.get("/todos", response_model=List[TodoResponse])
async def get_all_todos_endpoint(
    project_id: Optional[str] = None,
    completed: Optional[bool] = None,
    priority: Optional[Priority] = None,
    has_due_date: Optional[bool] = None,
    overdue: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """
    Get all todos for the current user.
    
    Query Parameters:
    - project_id: Filter by project ID
    - completed: Filter by completion status
    - priority: Filter by priority level (high, medium, low, none)
    - has_due_date: Filter todos with/without due dates
    - overdue: Filter overdue todos (uncompleted todos past due date)
    - skip: Number of records to skip (default: 0)
    - limit: Maximum number of records to return (default: 50, max: 100)
    """
    # Ensure limit is reasonable
    if limit > 100:
        limit = 100
    
    return await get_all_todos(
        user["user_id"],
        project_id=project_id,
        completed=completed,
        priority=priority.value if priority else None,
        has_due_date=has_due_date,
        overdue=overdue,
        skip=skip,
        limit=limit
    )


@router.put("/todos/{todo_id}", response_model=TodoResponse)
async def update_todo_endpoint(
    todo_id: str,
    update_data: UpdateTodoRequest,
    user: dict = Depends(get_current_user)
):
    """Update a todo item."""
    return await update_todo(todo_id, update_data, user["user_id"])


@router.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo_endpoint(
    todo_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a todo item."""
    await delete_todo(todo_id, user["user_id"])
    return None


# Project endpoints
@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project_endpoint(
    project: ProjectCreate,
    user: dict = Depends(get_current_user)
):
    """Create a new project."""
    return await create_project(project, user["user_id"])


@router.get("/projects", response_model=List[ProjectResponse])
async def get_all_projects_endpoint(
    user: dict = Depends(get_current_user)
):
    """Get all projects for the current user."""
    return await get_all_projects(user["user_id"])


@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project_endpoint(
    project_id: str,
    update_data: UpdateProjectRequest,
    user: dict = Depends(get_current_user)
):
    """Update a project."""
    return await update_project(project_id, update_data, user["user_id"])


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_endpoint(
    project_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a project. All todos in this project will be moved to Inbox."""
    await delete_project(project_id, user["user_id"])
    return None



@router.post("/todos/{todo_id}/subtasks", response_model=TodoResponse)
async def add_subtask_endpoint(
    todo_id: str,
    subtask: SubtaskCreateRequest,
    user: dict = Depends(get_current_user)
):
    """Add a subtask to a todo item."""
    from app.models.todo_models import SubTask
    import uuid
    
    # Get the todo first
    todo = await get_todo(todo_id, user["user_id"])
    
    # Create new subtask
    new_subtask = SubTask(
        id=str(uuid.uuid4()),
        title=subtask.title,
        completed=False
    )
    
    # Update todo with new subtask
    update_data = UpdateTodoRequest(
        subtasks=todo.subtasks + [new_subtask]
    )
    
    return await update_todo(todo_id, update_data, user["user_id"])


@router.put("/todos/{todo_id}/subtasks/{subtask_id}", response_model=TodoResponse)
async def update_subtask_endpoint(
    todo_id: str,
    subtask_id: str,
    update: SubtaskUpdateRequest,
    user: dict = Depends(get_current_user)
):
    """Update a specific subtask."""
    # Get the todo first
    todo = await get_todo(todo_id, user["user_id"])
    
    # Find and update the subtask
    updated_subtasks = []
    subtask_found = False
    for subtask in todo.subtasks:
        if subtask.id == subtask_id:
            subtask_found = True
            if update.title is not None:
                subtask.title = update.title
            if update.completed is not None:
                subtask.completed = update.completed
        updated_subtasks.append(subtask)
    
    if not subtask_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subtask with id {subtask_id} not found"
        )
    
    # Update todo with modified subtasks
    update_data = UpdateTodoRequest(subtasks=updated_subtasks)
    
    return await update_todo(todo_id, update_data, user["user_id"])


@router.delete("/todos/{todo_id}/subtasks/{subtask_id}", response_model=TodoResponse)
async def delete_subtask_endpoint(
    todo_id: str,
    subtask_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a subtask from a todo item."""
    # Get the todo first
    todo = await get_todo(todo_id, user["user_id"])
    
    # Remove the subtask
    updated_subtasks = [s for s in todo.subtasks if s.id != subtask_id]
    
    # Update todo with remaining subtasks
    update_data = UpdateTodoRequest(subtasks=updated_subtasks)
    
    return await update_todo(todo_id, update_data, user["user_id"])


# Bulk operations - MUST be before /{todo_id} routes
@router.post("/todos/bulk/complete", response_model=List[TodoResponse])
async def bulk_complete_todos_endpoint(
    todo_ids: List[str],
    user: dict = Depends(get_current_user)
):
    """Mark multiple todos as completed."""
    return await bulk_complete_todos(todo_ids, user["user_id"])


@router.post("/todos/bulk/move", response_model=List[TodoResponse])
async def bulk_move_todos_endpoint(
    request: dict,  # {"todo_ids": ["id1", "id2"], "project_id": "project_id"}
    user: dict = Depends(get_current_user)
):
    """Move multiple todos to a different project."""
    if "todo_ids" not in request or "project_id" not in request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="todo_ids and project_id are required"
        )
    
    return await bulk_move_todos(request["todo_ids"], request["project_id"], user["user_id"])


@router.delete("/todos/bulk/delete", status_code=status.HTTP_204_NO_CONTENT)
async def bulk_delete_todos_endpoint(
    todo_ids: List[str],
    user: dict = Depends(get_current_user)
):
    """Delete multiple todos."""
    await bulk_delete_todos(todo_ids, user["user_id"])
    return None


# Get a specific todo - MUST be after all specific routes
@router.get("/todos/{todo_id}", response_model=TodoResponse)
async def get_todo_endpoint(
    todo_id: str,
    user: dict = Depends(get_current_user)
):
    """Get a specific todo item."""
    return await get_todo(todo_id, user["user_id"])


@router.get("/todos/search/semantic", response_model=List[TodoResponse])
async def semantic_search_todos_endpoint(
    q: str,
    limit: int = 20,
    project_id: Optional[str] = None,
    completed: Optional[bool] = None,
    priority: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """
    Perform semantic search on todos using vector embeddings.

    Query Parameters:
    - q: Natural language search query
    - limit: Maximum number of results (default: 20)
    - project_id: Optional project filter
    - completed: Optional completion status filter
    - priority: Optional priority filter
    """
    from app.services.todo_service import semantic_search_todos

    return await semantic_search_todos(
        query=q,
        user_id=user["user_id"],
        limit=limit,
        project_id=project_id,
        completed=completed,
        priority=priority,
    )


@router.get("/todos/search/hybrid", response_model=List[TodoResponse])
async def hybrid_search_todos_endpoint(
    q: str,
    limit: int = 20,
    project_id: Optional[str] = None,
    completed: Optional[bool] = None,
    priority: Optional[str] = None,
    semantic_weight: float = 0.7,
    user: dict = Depends(get_current_user),
):
    """
    Perform hybrid search combining semantic and traditional search.

    Query Parameters:
    - q: Search query string
    - limit: Maximum number of results (default: 20)
    - project_id: Optional project filter
    - completed: Optional completion status filter
    - priority: Optional priority filter
    - semantic_weight: Weight for semantic results (0.0-1.0, default: 0.7)
    """
    from app.services.todo_service import hybrid_search_todos

    return await hybrid_search_todos(
        query=q,
        user_id=user["user_id"],
        limit=limit,
        project_id=project_id,
        completed=completed,
        priority=priority,
        semantic_weight=semantic_weight,
    )


@router.post("/todos/reindex")
async def reindex_todos_endpoint(
    batch_size: int = 100, user: dict = Depends(get_current_user)
):
    """
    Bulk reindex all user's todos in the vector database.

    Query Parameters:
    - batch_size: Number of todos to process in each batch (default: 100)
    """
    from app.services.todo_service import bulk_index_existing_todos

    return await bulk_index_existing_todos(user["user_id"], batch_size)