from typing import Annotated, Any, Dict, List, Optional
from datetime import datetime

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool

from app.config.loggers import chat_logger as logger
from app.docstrings.langchain.tools.todo_tool_docs import (
    CREATE_TODO,
    LIST_TODOS,
    UPDATE_TODO,
    DELETE_TODO,
    SEARCH_TODOS,
    GET_TODO_STATS,
    GET_TODAY_TODOS,
    GET_UPCOMING_TODOS,
    CREATE_PROJECT,
    LIST_PROJECTS,
    UPDATE_PROJECT,
    DELETE_PROJECT,
    GET_TODOS_BY_LABEL,
    GET_ALL_LABELS,
    BULK_COMPLETE_TODOS,
    BULK_MOVE_TODOS,
    BULK_DELETE_TODOS,
    ADD_SUBTASK,
    UPDATE_SUBTASK,
    DELETE_SUBTASK,
)
from app.docstrings.utils import with_doc
from app.models.todo_models import (
    TodoCreate,
    UpdateTodoRequest,
    ProjectCreate,
    UpdateProjectRequest,
    Priority,
    SubTask,
)
from app.services.todo_service import (
    create_todo as create_todo_service,
    get_todo as get_todo_service,
    get_all_todos as get_all_todos_service,
    update_todo as update_todo_service,
    delete_todo as delete_todo_service,
    search_todos as search_todos_service,
    get_todo_stats as get_todo_stats_service,
    get_todos_by_date_range,
    get_todos_by_label as get_todos_by_label_service,
    get_all_labels as get_all_labels_service,
    create_project as create_project_service,
    get_all_projects as get_all_projects_service,
    update_project as update_project_service,
    delete_project as delete_project_service,
)
from app.services.todo_bulk_service import (
    bulk_complete_todos as bulk_complete_service,
    bulk_move_todos as bulk_move_service,
    bulk_delete_todos as bulk_delete_service,
)


def get_user_id_from_config(config: RunnableConfig) -> str:
    """Extract user ID from the config."""
    if not config:
        logger.error("Todo tool called without config")
        return ""
    
    metadata = config.get("metadata", {})
    user_id = metadata.get("user_id", "")
    
    if not user_id:
        logger.error("No user_id found in config metadata")
    
    return user_id


@tool
@with_doc(CREATE_TODO)
async def create_todo(
    config: RunnableConfig,
    title: Annotated[str, "Title of the todo item (required)"],
    description: Annotated[Optional[str], "Detailed description of the todo"] = None,
    labels: Annotated[Optional[List[str]], "List of labels/tags for categorization"] = None,
    due_date: Annotated[Optional[datetime], "When the task should be completed"] = None,
    due_date_timezone: Annotated[Optional[str], "Timezone for the due date (e.g., 'America/New_York')"] = None,
    priority: Annotated[Optional[str], "Priority level: high, medium, low, or none"] = None,
    project_id: Annotated[Optional[str], "Project ID to assign the todo to"] = None,
) -> Dict[str, Any]:
    try:
        logger.info(f"Todo Tool: Creating todo with title '{title}'")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "todo": None}
        
        # Convert priority string to enum if provided
        priority_enum = Priority(priority) if priority else Priority.NONE
        
        todo_data = TodoCreate(
            title=title,
            description=description,
            labels=labels or [],
            due_date=due_date,
            due_date_timezone=due_date_timezone,
            priority=priority_enum,
            project_id=project_id,
        )
        
        result = await create_todo_service(todo_data, user_id)
        return {"todo": result.model_dump(), "error": None}
        
    except Exception as e:
        error_msg = f"Error creating todo: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "todo": None}


@tool
@with_doc(LIST_TODOS)
async def list_todos(
    config: RunnableConfig,
    project_id: Annotated[Optional[str], "Filter by specific project ID"] = None,
    completed: Annotated[Optional[bool], "Filter by completion status"] = None,
    priority: Annotated[Optional[str], "Filter by priority: high, medium, low, or none"] = None,
    has_due_date: Annotated[Optional[bool], "Filter todos with/without due dates"] = None,
    overdue: Annotated[Optional[bool], "Filter overdue uncompleted todos"] = None,
    skip: Annotated[int, "Number of records to skip for pagination"] = 0,
    limit: Annotated[int, "Maximum number of records to return"] = 50,
) -> Dict[str, Any]:
    try:
        logger.info("Todo Tool: Listing todos with filters")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "todos": []}
        
        # Ensure limit is reasonable
        if limit > 100:
            limit = 100
        
        # Convert priority string to value if provided
        priority_value = priority if priority else None
        
        results = await get_all_todos_service(
            user_id,
            project_id=project_id,
            completed=completed,
            priority=priority_value,
            has_due_date=has_due_date,
            overdue=overdue,
            skip=skip,
            limit=limit
        )
        
        return {
            "todos": [todo.model_dump() for todo in results],
            "count": len(results),
            "error": None
        }
        
    except Exception as e:
        error_msg = f"Error listing todos: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "todos": []}


@tool
@with_doc(UPDATE_TODO)
async def update_todo(
    config: RunnableConfig,
    todo_id: Annotated[str, "ID of the todo to update (required)"],
    title: Annotated[Optional[str], "New title for the todo"] = None,
    description: Annotated[Optional[str], "New description"] = None,
    labels: Annotated[Optional[List[str]], "New list of labels"] = None,
    due_date: Annotated[Optional[datetime], "New due date"] = None,
    due_date_timezone: Annotated[Optional[str], "New timezone for due date"] = None,
    priority: Annotated[Optional[str], "New priority: high, medium, low, or none"] = None,
    project_id: Annotated[Optional[str], "Move to different project"] = None,
    completed: Annotated[Optional[bool], "Mark as complete/incomplete"] = None,
) -> Dict[str, Any]:
    try:
        logger.info(f"Todo Tool: Updating todo {todo_id}")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "todo": None}
        
        # Build update data with only provided fields
        update_data = {}
        if title is not None:
            update_data["title"] = title
        if description is not None:
            update_data["description"] = description
        if labels is not None:
            update_data["labels"] = labels
        if due_date is not None:
            update_data["due_date"] = due_date
        if due_date_timezone is not None:
            update_data["due_date_timezone"] = due_date_timezone
        if priority is not None:
            update_data["priority"] = Priority(priority)
        if project_id is not None:
            update_data["project_id"] = project_id
        if completed is not None:
            update_data["completed"] = completed
        
        update_request = UpdateTodoRequest(**update_data)
        result = await update_todo_service(todo_id, update_request, user_id)
        
        return {"todo": result.model_dump(), "error": None}
        
    except Exception as e:
        error_msg = f"Error updating todo: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "todo": None}


@tool
@with_doc(DELETE_TODO)
async def delete_todo(
    config: RunnableConfig,
    todo_id: Annotated[str, "ID of the todo to delete (required)"],
) -> Dict[str, Any]:
    try:
        logger.info(f"Todo Tool: Deleting todo {todo_id}")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "success": False}
        
        await delete_todo_service(todo_id, user_id)
        return {"success": True, "error": None}
        
    except Exception as e:
        error_msg = f"Error deleting todo: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "success": False}


@tool
@with_doc(SEARCH_TODOS)
async def search_todos(
    config: RunnableConfig,
    query: Annotated[str, "Search query to match against todos (required)"],
) -> Dict[str, Any]:
    try:
        logger.info(f"Todo Tool: Searching todos with query '{query}'")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "todos": []}
        
        results = await search_todos_service(query, user_id)
        
        return {
            "todos": [todo.model_dump() for todo in results],
            "count": len(results),
            "error": None
        }
        
    except Exception as e:
        error_msg = f"Error searching todos: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "todos": []}


@tool
@with_doc(GET_TODO_STATS)
async def get_todo_statistics(config: RunnableConfig) -> Dict[str, Any]:
    try:
        logger.info("Todo Tool: Getting todo statistics")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "stats": None}
        
        stats = await get_todo_stats_service(user_id)
        return {"stats": stats, "error": None}
        
    except Exception as e:
        error_msg = f"Error getting todo statistics: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "stats": None}


@tool
@with_doc(GET_TODAY_TODOS)
async def get_today_todos(config: RunnableConfig) -> Dict[str, Any]:
    try:
        logger.info("Todo Tool: Getting today's todos")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "todos": []}
        
        from datetime import time
        today_start = datetime.combine(datetime.today(), time.min)
        today_end = datetime.combine(datetime.today(), time.max)
        
        results = await get_todos_by_date_range(user_id, today_start, today_end)
        
        return {
            "todos": [todo.model_dump() for todo in results],
            "count": len(results),
            "error": None
        }
        
    except Exception as e:
        error_msg = f"Error getting today's todos: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "todos": []}


@tool
@with_doc(GET_UPCOMING_TODOS)
async def get_upcoming_todos(
    config: RunnableConfig,
    days: Annotated[int, "Number of days to look ahead"] = 7,
) -> Dict[str, Any]:
    try:
        logger.info(f"Todo Tool: Getting upcoming todos for next {days} days")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "todos": []}
        
        from datetime import timedelta
        start_date = datetime.utcnow()
        end_date = start_date + timedelta(days=days)
        
        results = await get_todos_by_date_range(user_id, start_date, end_date)
        
        return {
            "todos": [todo.model_dump() for todo in results],
            "count": len(results),
            "error": None
        }
        
    except Exception as e:
        error_msg = f"Error getting upcoming todos: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "todos": []}


@tool
@with_doc(CREATE_PROJECT)
async def create_project(
    config: RunnableConfig,
    name: Annotated[str, "Name of the project (required)"],
    description: Annotated[Optional[str], "Project description"] = None,
    color: Annotated[Optional[str], "Hex color code (e.g., #FF5733)"] = None,
) -> Dict[str, Any]:
    try:
        logger.info(f"Todo Tool: Creating project '{name}'")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "project": None}
        
        project_data = ProjectCreate(
            name=name,
            description=description,
            color=color,
        )
        
        result = await create_project_service(project_data, user_id)
        return {"project": result.model_dump(), "error": None}
        
    except Exception as e:
        error_msg = f"Error creating project: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "project": None}


@tool
@with_doc(LIST_PROJECTS)
async def list_projects(config: RunnableConfig) -> Dict[str, Any]:
    try:
        logger.info("Todo Tool: Listing all projects")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "projects": []}
        
        results = await get_all_projects_service(user_id)
        
        return {
            "projects": [project.model_dump() for project in results],
            "count": len(results),
            "error": None
        }
        
    except Exception as e:
        error_msg = f"Error listing projects: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "projects": []}


@tool
@with_doc(UPDATE_PROJECT)
async def update_project(
    config: RunnableConfig,
    project_id: Annotated[str, "ID of the project to update (required)"],
    name: Annotated[Optional[str], "New project name"] = None,
    description: Annotated[Optional[str], "New project description"] = None,
    color: Annotated[Optional[str], "New hex color code"] = None,
) -> Dict[str, Any]:
    try:
        logger.info(f"Todo Tool: Updating project {project_id}")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "project": None}
        
        # Build update data with only provided fields
        update_data = {}
        if name is not None:
            update_data["name"] = name
        if description is not None:
            update_data["description"] = description
        if color is not None:
            update_data["color"] = color
        
        update_request = UpdateProjectRequest(**update_data)
        result = await update_project_service(project_id, update_request, user_id)
        
        return {"project": result.model_dump(), "error": None}
        
    except Exception as e:
        error_msg = f"Error updating project: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "project": None}


@tool
@with_doc(DELETE_PROJECT)
async def delete_project(
    config: RunnableConfig,
    project_id: Annotated[str, "ID of the project to delete (required)"],
) -> Dict[str, Any]:
    try:
        logger.info(f"Todo Tool: Deleting project {project_id}")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "success": False}
        
        await delete_project_service(project_id, user_id)
        return {"success": True, "error": None}
        
    except Exception as e:
        error_msg = f"Error deleting project: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "success": False}


@tool
@with_doc(GET_TODOS_BY_LABEL)
async def get_todos_by_label(
    config: RunnableConfig,
    label: Annotated[str, "The label to filter by (required)"],
) -> Dict[str, Any]:
    try:
        logger.info(f"Todo Tool: Getting todos with label '{label}'")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "todos": []}
        
        results = await get_todos_by_label_service(user_id, label)
        
        return {
            "todos": [todo.model_dump() for todo in results],
            "count": len(results),
            "error": None
        }
        
    except Exception as e:
        error_msg = f"Error getting todos by label: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "todos": []}


@tool
@with_doc(GET_ALL_LABELS)
async def get_all_labels(config: RunnableConfig) -> Dict[str, Any]:
    try:
        logger.info("Todo Tool: Getting all labels")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "labels": []}
        
        results = await get_all_labels_service(user_id)
        return {"labels": results, "error": None}
        
    except Exception as e:
        error_msg = f"Error getting labels: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "labels": []}


@tool
@with_doc(BULK_COMPLETE_TODOS)
async def bulk_complete_todos(
    config: RunnableConfig,
    todo_ids: Annotated[List[str], "List of todo IDs to mark as complete (required)"],
) -> Dict[str, Any]:
    try:
        logger.info(f"Todo Tool: Bulk completing {len(todo_ids)} todos")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "todos": []}
        
        results = await bulk_complete_service(todo_ids, user_id)
        
        return {
            "todos": [todo.model_dump() for todo in results],
            "count": len(results),
            "error": None
        }
        
    except Exception as e:
        error_msg = f"Error bulk completing todos: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "todos": []}


@tool
@with_doc(BULK_MOVE_TODOS)
async def bulk_move_todos(
    config: RunnableConfig,
    todo_ids: Annotated[List[str], "List of todo IDs to move (required)"],
    project_id: Annotated[str, "Target project ID (required)"],
) -> Dict[str, Any]:
    try:
        logger.info(f"Todo Tool: Moving {len(todo_ids)} todos to project {project_id}")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "todos": []}
        
        results = await bulk_move_service(todo_ids, project_id, user_id)
        
        return {
            "todos": [todo.model_dump() for todo in results],
            "count": len(results),
            "error": None
        }
        
    except Exception as e:
        error_msg = f"Error bulk moving todos: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "todos": []}


@tool
@with_doc(BULK_DELETE_TODOS)
async def bulk_delete_todos(
    config: RunnableConfig,
    todo_ids: Annotated[List[str], "List of todo IDs to delete (required)"],
) -> Dict[str, Any]:
    try:
        logger.info(f"Todo Tool: Bulk deleting {len(todo_ids)} todos")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "success": False}
        
        await bulk_delete_service(todo_ids, user_id)
        return {"success": True, "error": None}
        
    except Exception as e:
        error_msg = f"Error bulk deleting todos: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "success": False}


@tool
@with_doc(ADD_SUBTASK)
async def add_subtask(
    config: RunnableConfig,
    todo_id: Annotated[str, "Parent todo ID (required)"],
    title: Annotated[str, "Subtask title (required)"],
) -> Dict[str, Any]:
    try:
        logger.info(f"Todo Tool: Adding subtask to todo {todo_id}")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "todo": None}
        
        import uuid
        
        # Get the todo first
        todo = await get_todo_service(todo_id, user_id)
        
        # Create new subtask
        new_subtask = SubTask(
            id=str(uuid.uuid4()),
            title=title,
            completed=False
        )
        
        # Update todo with new subtask
        update_data = UpdateTodoRequest(
            subtasks=todo.subtasks + [new_subtask]
        )
        
        result = await update_todo_service(todo_id, update_data, user_id)
        return {"todo": result.model_dump(), "error": None}
        
    except Exception as e:
        error_msg = f"Error adding subtask: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "todo": None}


@tool
@with_doc(UPDATE_SUBTASK)
async def update_subtask(
    config: RunnableConfig,
    todo_id: Annotated[str, "Parent todo ID (required)"],
    subtask_id: Annotated[str, "Subtask ID to update (required)"],
    title: Annotated[Optional[str], "New subtask title"] = None,
    completed: Annotated[Optional[bool], "Subtask completion status"] = None,
) -> Dict[str, Any]:
    try:
        logger.info(f"Todo Tool: Updating subtask {subtask_id} in todo {todo_id}")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "todo": None}
        
        # Get the todo first
        todo = await get_todo_service(todo_id, user_id)
        
        # Find and update the subtask
        updated_subtasks = []
        subtask_found = False
        for subtask in todo.subtasks:
            if subtask.id == subtask_id:
                subtask_found = True
                if title is not None:
                    subtask.title = title
                if completed is not None:
                    subtask.completed = completed
            updated_subtasks.append(subtask)
        
        if not subtask_found:
            return {"error": f"Subtask {subtask_id} not found", "todo": None}
        
        # Update todo with modified subtasks
        update_data = UpdateTodoRequest(subtasks=updated_subtasks)
        result = await update_todo_service(todo_id, update_data, user_id)
        
        return {"todo": result.model_dump(), "error": None}
        
    except Exception as e:
        error_msg = f"Error updating subtask: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "todo": None}


@tool
@with_doc(DELETE_SUBTASK)
async def delete_subtask(
    config: RunnableConfig,
    todo_id: Annotated[str, "Parent todo ID (required)"],
    subtask_id: Annotated[str, "Subtask ID to delete (required)"],
) -> Dict[str, Any]:
    try:
        logger.info(f"Todo Tool: Deleting subtask {subtask_id} from todo {todo_id}")
        user_id = get_user_id_from_config(config)
        
        if not user_id:
            return {"error": "User authentication required", "todo": None}
        
        # Get the todo first
        todo = await get_todo_service(todo_id, user_id)
        
        # Remove the subtask
        updated_subtasks = [s for s in todo.subtasks if s.id != subtask_id]
        
        if len(updated_subtasks) == len(todo.subtasks):
            return {"error": f"Subtask {subtask_id} not found", "todo": None}
        
        # Update todo with remaining subtasks
        update_data = UpdateTodoRequest(subtasks=updated_subtasks)
        result = await update_todo_service(todo_id, update_data, user_id)
        
        return {"todo": result.model_dump(), "error": None}
        
    except Exception as e:
        error_msg = f"Error deleting subtask: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "todo": None}


# Export all todo tools as a list for easy registration
todo_tools = [
    create_todo,
    list_todos,
    update_todo,
    delete_todo,
    search_todos,
    get_todo_statistics,
    get_today_todos,
    get_upcoming_todos,
    create_project,
    list_projects,
    update_project,
    delete_project,
    get_todos_by_label,
    get_all_labels,
    bulk_complete_todos,
    bulk_move_todos,
    bulk_delete_todos,
    add_subtask,
    update_subtask,
    delete_subtask,
]