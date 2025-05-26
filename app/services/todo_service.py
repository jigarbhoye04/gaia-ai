from datetime import datetime
from typing import List, Optional
import uuid

from bson import ObjectId
from fastapi import HTTPException, status

from app.config.loggers import todos_logger
from app.db.collections import todos_collection, projects_collection
from app.db.redis import delete_cache, get_cache, set_cache
from app.db.utils import serialize_document
from app.models.todo_models import (
    TodoCreate,
    TodoResponse,
    UpdateTodoRequest,
    ProjectCreate,
    ProjectResponse,
    UpdateProjectRequest,
    SubTask
)

ONE_YEAR_TTL = 365 * 24 * 60 * 60
ONE_HOUR_TTL = 60 * 60

# Special constant for inbox project
INBOX_PROJECT_ID = "inbox"


async def create_todo(todo: TodoCreate, user_id: str) -> TodoResponse:
    """
    Create a new todo item.
    
    Args:
        todo: Todo creation model
        user_id: ID of the user creating the todo
        
    Returns:
        TodoResponse: The created todo item
    """
    try:
        # Get or create inbox project if no project specified
        if todo.project_id is None:
            inbox_id = await create_default_project_for_user(user_id)
            todo.project_id = inbox_id
        else:
            # Verify project exists
            project = await projects_collection.find_one({
                "_id": ObjectId(todo.project_id),
                "user_id": user_id
            })
            if not project:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Project with id {todo.project_id} not found"
                )
        
        todo_dict = todo.model_dump()
        todo_dict["user_id"] = user_id
        todo_dict["created_at"] = datetime.utcnow()
        todo_dict["updated_at"] = datetime.utcnow()
        todo_dict["completed"] = False
        todo_dict["subtasks"] = []
        
        result = await todos_collection.insert_one(todo_dict)
        created_todo = await todos_collection.find_one({"_id": result.inserted_id})
        
        # Clear cache
        await delete_cache(f"todos:{user_id}")
        await delete_cache(f"todos:{user_id}:project:{todo.project_id}")
        
        todos_logger.info(f"Created todo {result.inserted_id} for user {user_id}")
        
        return TodoResponse(**serialize_document(created_todo))
    
    except HTTPException:
        raise
    except Exception as e:
        todos_logger.error(f"Error creating todo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create todo: {str(e)}"
        )


async def get_todo(todo_id: str, user_id: str) -> TodoResponse:
    """
    Get a specific todo item.
    
    Args:
        todo_id: ID of the todo to retrieve
        user_id: ID of the user requesting the todo
        
    Returns:
        TodoResponse: The requested todo item
    """
    # Check cache first
    cache_key = f"todo:{user_id}:{todo_id}"
    cached_todo = await get_cache(cache_key)
    if cached_todo:
        return TodoResponse(**cached_todo)
    
    try:
        todo = await todos_collection.find_one({
            "_id": ObjectId(todo_id),
            "user_id": user_id
        })
        
        if not todo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Todo with id {todo_id} not found"
            )
        
        todo_response = TodoResponse(**serialize_document(todo))
        
        # Cache the result
        await set_cache(cache_key, todo_response.model_dump(), ONE_HOUR_TTL)
        
        return todo_response
    
    except HTTPException:
        raise
    except Exception as e:
        todos_logger.error(f"Error retrieving todo {todo_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve todo: {str(e)}"
        )


async def get_all_todos(
    user_id: str,
    project_id: Optional[str] = None,
    completed: Optional[bool] = None,
    priority: Optional[str] = None,
    has_due_date: Optional[bool] = None,
    overdue: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50
) -> List[TodoResponse]:
    """
    Get all todos for a user with optional filtering.
    
    Args:
        user_id: ID of the user
        project_id: Optional project ID to filter by
        completed: Optional completion status filter
        priority: Optional priority filter
        has_due_date: Optional filter for todos with due dates
        overdue: Optional filter for overdue todos
        
    Returns:
        List[TodoResponse]: List of todos matching the criteria
    """
    # Build cache key based on filters
    cache_key_parts = [f"todos:{user_id}"]
    if project_id:
        cache_key_parts.append(f"project:{project_id}")
    if completed is not None:
        cache_key_parts.append(f"completed:{completed}")
    if priority:
        cache_key_parts.append(f"priority:{priority}")
    if has_due_date is not None:
        cache_key_parts.append(f"has_due_date:{has_due_date}")
    if overdue is not None:
        cache_key_parts.append(f"overdue:{overdue}")
    cache_key_parts.append(f"skip:{skip}")
    cache_key_parts.append(f"limit:{limit}")
    
    cache_key = ":".join(cache_key_parts)
    cached_todos = await get_cache(cache_key)
    if cached_todos:
        return [TodoResponse(**todo) for todo in cached_todos]
    
    try:
        # Build query
        query = {"user_id": user_id}
        if project_id:
            query["project_id"] = project_id
        if completed is not None:
            query["completed"] = completed
        if priority:
            query["priority"] = priority
        
        # Handle due date filters
        if has_due_date is True:
            query["due_date"] = {"$ne": None}
        elif has_due_date is False:
            query["due_date"] = None
        
        # Handle overdue filter
        if overdue is True:
            query["due_date"] = {"$lt": datetime.utcnow()}
            query["completed"] = False  # Only uncompleted todos can be overdue
        elif overdue is False and has_due_date is not False:
            query["$or"] = [
                {"due_date": None},
                {"due_date": {"$gte": datetime.utcnow()}}
            ]
        
        cursor = todos_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        todos = await cursor.to_list(length=limit)
        
        todo_responses = [TodoResponse(**serialize_document(todo)) for todo in todos]
        
        # Cache the results
        await set_cache(
            cache_key,
            [todo.model_dump() for todo in todo_responses],
            ONE_HOUR_TTL
        )
        
        return todo_responses
    
    except Exception as e:
        todos_logger.error(f"Error retrieving todos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve todos: {str(e)}"
        )


async def update_todo(
    todo_id: str,
    update_data: UpdateTodoRequest,
    user_id: str
) -> TodoResponse:
    """
    Update a todo item.
    
    Args:
        todo_id: ID of the todo to update
        update_data: Update data
        user_id: ID of the user updating the todo
        
    Returns:
        TodoResponse: The updated todo item
    """
    try:
        # Verify todo exists and belongs to user
        existing_todo = await todos_collection.find_one({
            "_id": ObjectId(todo_id),
            "user_id": user_id
        })
        
        if not existing_todo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Todo with id {todo_id} not found"
            )
        
        # Prepare update data
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        
        # Verify new project exists if changing project
        if "project_id" in update_dict and update_dict["project_id"] is not None:
            project = await projects_collection.find_one({
                "_id": ObjectId(update_dict["project_id"]),
                "user_id": user_id
            })
            if not project:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Project with id {update_dict['project_id']} not found"
                )
        
        # Convert SubTask objects to dicts if present
        if "subtasks" in update_dict:
            update_dict["subtasks"] = [
                subtask.model_dump() if isinstance(subtask, SubTask) else subtask
                for subtask in update_dict["subtasks"]
            ]
            # Generate IDs for new subtasks without IDs
            for subtask in update_dict["subtasks"]:
                if not subtask.get("id"):
                    subtask["id"] = str(uuid.uuid4())
        
        update_dict["updated_at"] = datetime.utcnow()
        
        # Update the todo
        await todos_collection.update_one(
            {"_id": ObjectId(todo_id)},
            {"$set": update_dict}
        )
        
        # Get updated todo
        updated_todo = await todos_collection.find_one({"_id": ObjectId(todo_id)})
        
        # Clear relevant caches
        await delete_cache(f"todo:{user_id}:{todo_id}")
        await delete_cache(f"todos:{user_id}")
        if existing_todo.get("project_id"):
            await delete_cache(f"todos:{user_id}:project:{existing_todo['project_id']}")
        if "project_id" in update_dict:
            await delete_cache(f"todos:{user_id}:project:{update_dict['project_id']}")
        
        todos_logger.info(f"Updated todo {todo_id} for user {user_id}")
        
        return TodoResponse(**serialize_document(updated_todo))
    
    except HTTPException:
        raise
    except Exception as e:
        todos_logger.error(f"Error updating todo {todo_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update todo: {str(e)}"
        )


async def delete_todo(todo_id: str, user_id: str) -> None:
    """
    Delete a todo item.
    
    Args:
        todo_id: ID of the todo to delete
        user_id: ID of the user deleting the todo
    """
    try:
        # Verify todo exists and get project_id for cache clearing
        todo = await todos_collection.find_one({
            "_id": ObjectId(todo_id),
            "user_id": user_id
        })
        
        if not todo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Todo with id {todo_id} not found"
            )
        
        # Delete the todo
        await todos_collection.delete_one({"_id": ObjectId(todo_id)})
        
        # Clear caches
        await delete_cache(f"todo:{user_id}:{todo_id}")
        await delete_cache(f"todos:{user_id}")
        if todo.get("project_id"):
            await delete_cache(f"todos:{user_id}:project:{todo['project_id']}")
        
        todos_logger.info(f"Deleted todo {todo_id} for user {user_id}")
    
    except HTTPException:
        raise
    except Exception as e:
        todos_logger.error(f"Error deleting todo {todo_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete todo: {str(e)}"
        )


# Project management functions

async def create_default_project_for_user(user_id: str) -> str:
    """
    Create the default Inbox project for a new user.
    
    Args:
        user_id: ID of the user
        
    Returns:
        str: The ID of the inbox project
    """
    try:
        # Check if user already has an inbox project
        existing_inbox = await projects_collection.find_one({
            "user_id": user_id,
            "is_default": True
        })
        
        if existing_inbox:
            return str(existing_inbox["_id"])
        
        # Create new inbox project with generated ObjectId
        inbox_project = {
            "user_id": user_id,
            "name": "Inbox",
            "description": "Default project for new todos",
            "color": "#6B7280",  # Gray color
            "is_default": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await projects_collection.insert_one(inbox_project)
        todos_logger.info(f"Created default Inbox project for user {user_id}")
        return str(result.inserted_id)
    
    except Exception as e:
        todos_logger.error(f"Error creating default project: {str(e)}")
        raise


async def create_project(project: ProjectCreate, user_id: str) -> ProjectResponse:
    """
    Create a new project.
    
    Args:
        project: Project creation model
        user_id: ID of the user creating the project
        
    Returns:
        ProjectResponse: The created project
    """
    try:
        # Ensure user has default project
        await create_default_project_for_user(user_id)
        
        project_dict = project.model_dump()
        project_dict["user_id"] = user_id
        project_dict["is_default"] = False
        project_dict["created_at"] = datetime.utcnow()
        project_dict["updated_at"] = datetime.utcnow()
        
        result = await projects_collection.insert_one(project_dict)
        created_project = await projects_collection.find_one({"_id": result.inserted_id})
        
        # Get todo count
        todo_count = await todos_collection.count_documents({
            "user_id": user_id,
            "project_id": str(result.inserted_id)
        })
        
        project_response = ProjectResponse(
            **serialize_document(created_project),
            todo_count=todo_count
        )
        
        # Clear cache
        await delete_cache(f"projects:{user_id}")
        
        todos_logger.info(f"Created project {result.inserted_id} for user {user_id}")
        
        return project_response
    
    except Exception as e:
        todos_logger.error(f"Error creating project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}"
        )


async def get_all_projects(user_id: str) -> List[ProjectResponse]:
    """
    Get all projects for a user.
    
    Args:
        user_id: ID of the user
        
    Returns:
        List[ProjectResponse]: List of all user's projects
    """
    cache_key = f"projects:{user_id}"
    cached_projects = await get_cache(cache_key)
    if cached_projects:
        return [ProjectResponse(**project) for project in cached_projects]
    
    try:
        # Ensure user has default project
        inbox_id = await create_default_project_for_user(user_id)
        
        # Use aggregation to get projects with todo counts in one query
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$sort": {"created_at": -1}},
            {
                "$lookup": {
                    "from": "todos",
                    "let": {
                        "project_id": {
                            "$cond": {
                                "if": "$is_default",
                                "then": inbox_id,
                                "else": {"$toString": "$_id"}
                            }
                        }
                    },
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [
                                        {"$eq": ["$user_id", user_id]},
                                        {"$eq": ["$project_id", "$$project_id"]}
                                    ]
                                }
                            }
                        },
                        {"$count": "count"}
                    ],
                    "as": "todo_stats"
                }
            },
            {
                "$addFields": {
                    "todo_count": {
                        "$ifNull": [{"$first": "$todo_stats.count"}, 0]
                    }
                }
            },
            {"$project": {"todo_stats": 0}}
        ]
        
        cursor = projects_collection.aggregate(pipeline)
        projects = await cursor.to_list(length=None)
        
        project_responses = [
            ProjectResponse(**serialize_document(project))
            for project in projects
        ]
        
        # Cache the results
        await set_cache(
            cache_key,
            [project.model_dump() for project in project_responses],
            ONE_HOUR_TTL
        )
        
        return project_responses
    
    except Exception as e:
        todos_logger.error(f"Error retrieving projects: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve projects: {str(e)}"
        )


async def update_project(
    project_id: str,
    update_data: UpdateProjectRequest,
    user_id: str
) -> ProjectResponse:
    """
    Update a project.
    
    Args:
        project_id: ID of the project to update
        update_data: Update data
        user_id: ID of the user updating the project
        
    Returns:
        ProjectResponse: The updated project
    """
    try:
        # Verify project exists and belongs to user
        existing_project = await projects_collection.find_one({
            "_id": ObjectId(project_id),
            "user_id": user_id
        })
        
        if not existing_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project with id {project_id} not found"
            )
        
        # Prevent updating default project
        if existing_project.get("is_default"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update the default Inbox project"
            )
        
        # Prepare update data
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        # Update the project
        await projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": update_dict}
        )
        
        # Get updated project
        updated_project = await projects_collection.find_one({"_id": ObjectId(project_id)})
        
        # Get todo count
        todo_count = await todos_collection.count_documents({
            "user_id": user_id,
            "project_id": project_id
        })
        
        # Clear cache
        await delete_cache(f"projects:{user_id}")
        
        todos_logger.info(f"Updated project {project_id} for user {user_id}")
        
        return ProjectResponse(
            **serialize_document(updated_project),
            todo_count=todo_count
        )
    
    except HTTPException:
        raise
    except Exception as e:
        todos_logger.error(f"Error updating project {project_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project: {str(e)}"
        )


async def delete_project(project_id: str, user_id: str) -> None:
    """
    Delete a project and move all its todos to Inbox.
    
    Args:
        project_id: ID of the project to delete
        user_id: ID of the user deleting the project
    """
    try:
        # Verify project exists
        project = await projects_collection.find_one({
            "_id": ObjectId(project_id),
            "user_id": user_id
        })
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project with id {project_id} not found"
            )
        
        # Prevent deleting default project
        if project.get("is_default"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the default Inbox project"
            )
        
        # Move all todos from this project to inbox
        await todos_collection.update_many(
            {"user_id": user_id, "project_id": project_id},
            {"$set": {"project_id": "inbox", "updated_at": datetime.utcnow()}}
        )
        
        # Delete the project
        await projects_collection.delete_one({"_id": ObjectId(project_id)})
        
        # Clear caches
        await delete_cache(f"projects:{user_id}")
        await delete_cache(f"todos:{user_id}")
        await delete_cache(f"todos:{user_id}:project:{project_id}")
        
        todos_logger.info(f"Deleted project {project_id} for user {user_id}")
    
    except HTTPException:
        raise
    except Exception as e:
        todos_logger.error(f"Error deleting project {project_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project: {str(e)}"
        )


# Additional helper functions

async def search_todos(query: str, user_id: str) -> List[TodoResponse]:
    """
    Search todos by title, description, or labels.
    
    Args:
        query: Search query string
        user_id: ID of the user
        
    Returns:
        List[TodoResponse]: List of matching todos
    """
    try:
        # Create text search query
        search_query = {
            "user_id": user_id,
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
                {"labels": {"$in": [query]}}
            ]
        }
        
        cursor = todos_collection.find(search_query).sort("created_at", -1)
        todos = await cursor.to_list(length=None)
        
        return [TodoResponse(**serialize_document(todo)) for todo in todos]
    
    except Exception as e:
        todos_logger.error(f"Error searching todos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search todos: {str(e)}"
        )


async def get_todo_stats(user_id: str) -> dict:
    """
    Get statistics about user's todos.
    
    Args:
        user_id: ID of the user
        
    Returns:
        dict: Statistics about todos
    """
    try:
        # Get all todos for the user
        all_todos = await todos_collection.find({"user_id": user_id}).to_list(length=None)
        
        # Calculate statistics
        total = len(all_todos)
        completed = sum(1 for todo in all_todos if todo.get("completed"))
        pending = total - completed
        
        # Count by priority
        priority_counts = {
            "high": 0,
            "medium": 0,
            "low": 0,
            "none": 0
        }
        for todo in all_todos:
            priority = todo.get("priority", "none")
            priority_counts[priority] += 1
        
        # Count overdue
        overdue = 0
        for todo in all_todos:
            if (not todo.get("completed") and 
                todo.get("due_date") and 
                todo["due_date"] < datetime.utcnow()):
                overdue += 1
        
        # Count by project
        project_counts = {}
        for todo in all_todos:
            project_id = todo.get("project_id", "inbox")
            project_counts[project_id] = project_counts.get(project_id, 0) + 1
        
        return {
            "total": total,
            "completed": completed,
            "pending": pending,
            "overdue": overdue,
            "by_priority": priority_counts,
            "by_project": project_counts,
            "completion_rate": round((completed / total * 100) if total > 0 else 0, 2)
        }
    
    except Exception as e:
        todos_logger.error(f"Error getting todo stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get todo stats: {str(e)}"
        )


async def get_todos_by_date_range(
    user_id: str,
    start_date: datetime,
    end_date: datetime
) -> List[TodoResponse]:
    """
    Get todos within a date range.
    
    Args:
        user_id: ID of the user
        start_date: Start of date range
        end_date: End of date range
        
    Returns:
        List[TodoResponse]: List of todos within the date range
    """
    try:
        query = {
            "user_id": user_id,
            "due_date": {
                "$gte": start_date,
                "$lte": end_date
            },
            "completed": False  # Only show uncompleted todos
        }
        
        cursor = todos_collection.find(query).sort("due_date", 1)
        todos = await cursor.to_list(length=None)
        
        return [TodoResponse(**serialize_document(todo)) for todo in todos]
    
    except Exception as e:
        todos_logger.error(f"Error getting todos by date range: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get todos by date range: {str(e)}"
        )


async def get_all_labels(user_id: str) -> List[dict]:
    """
    Get all unique labels used by the user with their counts.
    
    Args:
        user_id: ID of the user
        
    Returns:
        List[dict]: List of label objects with name and count
    """
    try:
        # Use aggregation to get unique labels with counts (only from non-completed todos)
        pipeline = [
            {"$match": {
                "user_id": user_id,
                "completed": False  # Only count labels from non-completed todos
            }},
            {"$unwind": "$labels"},
            {
                "$group": {
                    "_id": "$labels",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"count": -1}},  # Sort by most used first
            {
                "$project": {
                    "_id": 0,
                    "name": "$_id",
                    "count": 1
                }
            }
        ]
        
        labels = await todos_collection.aggregate(pipeline).to_list(length=None)
        return labels
    
    except Exception as e:
        todos_logger.error(f"Error getting all labels: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get labels: {str(e)}"
        )


async def get_todos_by_label(user_id: str, label: str) -> List[TodoResponse]:
    """
    Get all todos that have a specific label.
    
    Args:
        user_id: ID of the user
        label: The label to filter by
        
    Returns:
        List[TodoResponse]: List of todos with the specified label
    """
    try:
        query = {
            "user_id": user_id,
            "labels": label  # MongoDB automatically matches arrays containing this value
        }
        
        cursor = todos_collection.find(query).sort("created_at", -1)
        todos = await cursor.to_list(length=None)
        
        return [TodoResponse(**serialize_document(todo)) for todo in todos]
    
    except Exception as e:
        todos_logger.error(f"Error getting todos by label: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get todos by label: {str(e)}"
        )