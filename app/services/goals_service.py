import json
import uuid
from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException
from langchain_core.messages import HumanMessage

from app.db.collections import goals_collection
from app.db.redis import ONE_YEAR_TTL, delete_cache, get_cache, set_cache
from app.models.goals_models import GoalCreate, UpdateNodeRequest, GoalResponse
from app.utils.goals_utils import goal_helper
from app.config.loggers import goals_logger as logger
from app.langchain.prompts.goal_prompts import (
    ROADMAP_JSON_STRUCTURE,
    ROADMAP_INSTRUCTIONS,
    ROADMAP_GENERATOR,
)
from app.langchain.llm.client import init_llm
from app.services.todo_service import TodoService
from app.models.todo_models import TodoCreate, Priority


async def generate_roadmap_with_llm_stream(title: str):
    """
    Generate a roadmap using LLM streaming for real-time updates.

    Args:
        title (str): The goal title to generate a roadmap for

    Yields:
        dict: Streaming progress updates and final roadmap data
    """
    detailed_prompt = ROADMAP_GENERATOR.format(
        title=title,
        instructions=ROADMAP_INSTRUCTIONS,
        json_structure=json.dumps(ROADMAP_JSON_STRUCTURE, indent=2),
    )

    try:
        # Initialize the LLM client
        llm = init_llm()

        # Send initial progress message
        yield {"progress": f"Starting roadmap generation for '{title}'..."}

        # Create message for LLM
        messages = [HumanMessage(content=detailed_prompt)]

        # Stream the response
        complete_response = ""
        chunk_count = 0

        async for chunk in llm.astream(messages):
            chunk_count += 1
            content = chunk.content

            if content:
                complete_response += str(content)

                # Send progress updates every 10 chunks
                if chunk_count % 10 == 0:
                    yield {
                        "progress": f"Generating roadmap... ({len(complete_response)} characters)"
                    }

        # Send completion message
        yield {"progress": "Processing generated roadmap..."}

        # Try to parse the complete response as JSON
        try:
            # Clean the response - sometimes LLM adds extra text
            json_start = complete_response.find("{")
            json_end = complete_response.rfind("}") + 1

            if json_start != -1 and json_end != 0:
                json_str = complete_response[json_start:json_end]
                roadmap_data = json.loads(json_str)

                # Validate the structure
                if "nodes" in roadmap_data and "edges" in roadmap_data:
                    yield {"progress": "Roadmap generation completed successfully!"}
                    yield {"roadmap": roadmap_data}
                else:
                    logger.error("Generated roadmap missing required fields")
                    yield {"error": "Generated roadmap is missing required structure"}
            else:
                logger.error("No valid JSON found in LLM response")
                yield {"error": "Could not parse roadmap from LLM response"}

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}")
            logger.error(f"Raw response: {complete_response}")
            yield {"error": f"Failed to parse roadmap JSON: {str(e)}"}

    except Exception as e:
        logger.error(f"LLM Generation Error: {e}")
        yield {"error": f"Roadmap generation failed: {str(e)}"}


async def create_goal_service(goal: GoalCreate, user: dict) -> GoalResponse:
    """
    Create a new goal for the authenticated user.

    Args:
        goal (GoalCreate): The goal data to be created.
        user (dict): The authenticated user's data.

    Returns:
        GoalResponse: The created goal's details.

    Raises:
        HTTPException: If goal creation fails.
    """
    user_id = user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=403, detail="Not authenticated")

    goal_data = {
        "title": goal.title,
        "description": goal.description,
        "created_at": datetime.now().isoformat(),
        "user_id": user_id,
        "roadmap": {"nodes": [], "edges": []},
    }

    try:
        result = await goals_collection.insert_one(goal_data)
        new_goal = await goals_collection.find_one({"_id": result.inserted_id})

        # Invalidate user's goals list cache and statistics
        cache_key_goals = f"goals_cache:{user_id}"
        cache_key_stats = f"goal_stats_cache:{user_id}"
        await delete_cache(cache_key_goals)
        await delete_cache(cache_key_stats)

        formatted_goal = goal_helper(new_goal)
        logger.info(f"Goal created successfully for user {user_id}. Cache invalidated.")
        return GoalResponse(**formatted_goal)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create goal {e}")


async def get_goal_service(goal_id: str, user: dict) -> dict:
    """
    Retrieve a goal by its ID for the authenticated user.

    Args:
        goal_id (str): The goal's ID.
        user (dict): The authenticated user's data.

    Returns:
        dict: The goal's details if found, or a message prompting roadmap generation.
    """
    user_id = user.get("user_id")
    if not user_id:
        logger.warning("Unauthorized attempt to access goal details.")
        raise HTTPException(status_code=403, detail="Not authenticated")

    cache_key = f"goal_cache:{goal_id}"
    cached_goal = await get_cache(cache_key)
    if cached_goal:
        logger.info(f"Goal {goal_id} fetched from cache.")
        # Handle both string and dict cached data
        if isinstance(cached_goal, str):
            return json.loads(cached_goal)
        else:
            return cached_goal

    goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})
    if not goal:
        logger.error(f"Goal with ID {goal_id} not found.")
        raise HTTPException(status_code=404, detail="Goal not found")

    roadmap = goal.get("roadmap", {})
    if not roadmap.get("nodes") or not roadmap.get("edges"):
        logger.info(f"Goal {goal_id} has no roadmap. Prompting user to generate one.")
        return {
            "message": "Roadmap not available. Please generate it using the WebSocket.",
            "id": goal_id,
            "title": goal["title"],
        }

    goal_helper_result = goal_helper(goal)
    await set_cache(cache_key, json.dumps(goal_helper_result), ONE_YEAR_TTL)
    logger.info(f"Goal {goal_id} details fetched successfully.")
    return goal_helper_result


async def get_user_goals_service(user: dict) -> list:
    """
    List all goals for the authenticated user.

    Args:
        user (dict): The authenticated user's data.

    Returns:
        list: A list of goals.
    """
    user_id = user.get("user_id")
    if not user_id:
        logger.warning("Unauthorized attempt to list user goals.")
        raise HTTPException(status_code=403, detail="Not authenticated")

    cache_key = f"goals_cache:{user_id}"
    cached_goals = await get_cache(cache_key)
    if cached_goals:
        logger.info(f"Fetched user goals from cache for user {user_id}.")
        # Handle both string and dict cached data
        if isinstance(cached_goals, str):
            parsed_data = json.loads(cached_goals)
            return parsed_data.get("goals", [])
        else:
            return cached_goals.get("goals", [])

    goals = await goals_collection.find({"user_id": user_id}).to_list(None)
    goals_list = [goal_helper(goal) for goal in goals]

    # Cache the goals list as JSON string for consistency
    await set_cache(cache_key, json.dumps({"goals": goals_list}), ONE_YEAR_TTL)
    logger.info(f"Listed all goals for user {user_id}.")
    return goals_list


async def delete_goal_service(goal_id: str, user: dict) -> dict:
    """
    Delete a specific goal by its ID for the authenticated user.

    Args:
        goal_id (str): The ID of the goal to delete.
        user (dict): The authenticated user's data.

    Returns:
        dict: The details of the deleted goal.
    """
    user_id = user.get("user_id")
    if not user_id:
        logger.warning("Unauthorized attempt to delete goal.")
        raise HTTPException(status_code=403, detail="Not authenticated")

    goal = await goals_collection.find_one(
        {"_id": ObjectId(goal_id), "user_id": user_id}
    )
    if not goal:
        logger.error(f"Goal {goal_id} not found for user {user_id}.")
        raise HTTPException(status_code=404, detail="Goal not found")

    result = await goals_collection.delete_one({"_id": ObjectId(goal_id)})
    if result.deleted_count == 0:
        logger.error(f"Failed to delete goal {goal_id}.")
        raise HTTPException(status_code=500, detail="Failed to delete the goal")

    cache_key_goal = f"goal_cache:{goal_id}"
    cache_key_goals = f"goals_cache:{user_id}"
    cache_key_stats = f"goal_stats_cache:{user_id}"
    await delete_cache(cache_key_goal)
    await delete_cache(cache_key_goals)
    await delete_cache(cache_key_stats)

    logger.info(f"Goal {goal_id} deleted successfully by user {user_id}.")
    return goal_helper(goal)


async def update_node_status_service(
    goal_id: str, node_id: str, update_data: UpdateNodeRequest, user: dict
) -> dict:
    """
    Update the completion status of a node in a goal's roadmap.

    Args:
        goal_id (str): The ID of the goal.
        node_id (str): The ID of the node to update.
        update_data (UpdateNodeRequest): Data containing the updated status.
        user (dict): The authenticated user's data.

    Returns:
        dict: The updated goal's details.
    """
    user_id = user.get("user_id")
    if not user_id:
        logger.warning("Unauthorized attempt to update node status.")
        raise HTTPException(status_code=403, detail="Not authenticated")

    goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})
    if not goal:
        logger.error(f"Goal {goal_id} not found.")
        raise HTTPException(status_code=404, detail="Goal not found")

    roadmap = goal.get("roadmap", {})
    nodes = roadmap.get("nodes", [])
    node = next((n for n in nodes if n["id"] == node_id), None)
    if not node:
        logger.error(f"Node {node_id} not found in goal {goal_id}.")
        raise HTTPException(status_code=404, detail="Node not found in roadmap")

    node["data"]["isComplete"] = update_data.is_complete

    await goals_collection.update_one(
        {"_id": ObjectId(goal_id)}, {"$set": {"roadmap.nodes": nodes}}
    )

    # Sync completion status with corresponding todo
    await sync_goal_node_completion(goal_id, node_id, update_data.is_complete, user_id)

    updated_goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})

    cache_key_goal = f"goal_cache:{goal_id}"
    cache_key_goals = f"goals_cache:{user_id}"
    cache_key_stats = f"goal_stats_cache:{user_id}"
    await delete_cache(cache_key_goal)
    await delete_cache(cache_key_goals)
    await delete_cache(cache_key_stats)

    logger.info(f"Node status updated for node {node_id} in goal {goal_id}.")
    return goal_helper(updated_goal)


async def _get_or_create_goals_project(user_id: str) -> str:
    """Get or create the shared 'Goals' project for a user."""
    from app.db.collections import projects_collection

    existing = await projects_collection.find_one(
        {"user_id": user_id, "name": "Goals", "color": "#8B5CF6"}
    )

    if existing:
        return str(existing["_id"])

    goals_project = {
        "user_id": user_id,
        "name": "Goals",
        "description": "All your goals and roadmaps",
        "color": "#8B5CF6",  # Purple color for goals
        "is_default": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    result = await projects_collection.insert_one(goals_project)
    return str(result.inserted_id)


async def create_goal_project_and_todo(
    goal_id: str, goal_title: str, roadmap_data: dict, user_id: str
) -> str:
    """
    Create a todo in the shared 'Goals' project with subtasks for roadmap nodes.

    Args:
        goal_id (str): The goal ID
        goal_title (str): The goal title
        roadmap_data (dict): The roadmap data with nodes and edges
        user_id (str): The user ID

    Returns:
        str: The Goals project ID
    """
    try:
        # Get or create the shared "Goals" project
        project_id = await _get_or_create_goals_project(user_id)

        # Create subtasks for each roadmap node
        nodes = roadmap_data.get("nodes", [])
        subtasks = []

        for node in nodes:
            node_data = node.get("data", {})

            # Skip start/end nodes typically used in flowcharts
            if node_data.get("type") in ["start", "end"]:
                continue

            # Generate subtask ID and store in node for syncing
            subtask_id = str(uuid.uuid4())
            node_data["subtask_id"] = subtask_id

            # Create subtask
            from app.models.todo_models import SubTask

            subtask = SubTask(
                id=subtask_id,
                title=node_data.get("title", node_data.get("label", "Untitled Task")),
                completed=node_data.get("isComplete", False),
            )
            subtasks.append(subtask)

        # Create a single todo with all roadmap nodes as subtasks
        todo = TodoCreate(
            title=goal_title,
            description=f"Goal: {goal_title}",
            project_id=project_id,
            priority=Priority.HIGH,
        )

        created_todo = await TodoService.create_todo(todo, user_id)

        # Now add subtasks if we have any
        if subtasks:
            from app.models.todo_models import UpdateTodoRequest

            await TodoService.update_todo(
                created_todo.id, UpdateTodoRequest(subtasks=subtasks), user_id
            )

        # Update the goal with the modified roadmap (now contains subtask_ids) and todo info
        await goals_collection.update_one(
            {"_id": ObjectId(goal_id)},
            {
                "$set": {
                    "roadmap": roadmap_data,
                    "todo_project_id": project_id,
                    "todo_id": created_todo.id,
                }
            },
        )

        logger.info(
            f"Added goal todo {created_todo.id} with {len(subtasks)} subtasks to Goals project {project_id} for goal {goal_id}"
        )
        return project_id

    except Exception as e:
        logger.error(f"Error creating goal todo in Goals project: {str(e)}")
        raise


async def sync_goal_node_completion(
    goal_id: str, node_id: str, is_complete: bool, user_id: str
) -> bool:
    """
    Sync completion status between goal roadmap node and corresponding subtask.

    Args:
        goal_id (str): The goal ID
        node_id (str): The roadmap node ID
        is_complete (bool): The completion status
        user_id (str): The user ID

    Returns:
        bool: True if sync was successful
    """
    try:
        # Get the goal to find the subtask_id and todo_id
        goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})
        if not goal:
            return False

        roadmap = goal.get("roadmap", {})
        nodes = roadmap.get("nodes", [])

        # Find the node and get its subtask_id
        node = next((n for n in nodes if n["id"] == node_id), None)
        if not node:
            return False

        subtask_id = node.get("data", {}).get("subtask_id")
        todo_id = goal.get("todo_id")
        if not subtask_id or not todo_id:
            return False

        # Get the current todo to update its subtasks
        todo = await TodoService.get_todo(todo_id, user_id)

        # Update the specific subtask completion status
        updated_subtasks = []
        for subtask in todo.subtasks:
            if subtask.id == subtask_id:
                subtask.completed = is_complete
            updated_subtasks.append(subtask)

        # Update the todo with modified subtasks
        from app.models.todo_models import UpdateTodoRequest

        await TodoService.update_todo(
            todo_id, UpdateTodoRequest(subtasks=updated_subtasks), user_id
        )

        logger.info(
            f"Synced completion status for node {node_id} <-> subtask {subtask_id}: {is_complete}"
        )
        return True

    except Exception as e:
        logger.error(f"Error syncing goal node completion: {str(e)}")
        return False


async def sync_subtask_to_goal_completion(
    todo_id: str, subtask_id: str, is_complete: bool, user_id: str
) -> bool:
    """
    Sync completion status from subtask back to goal roadmap node.

    Args:
        todo_id (str): The todo ID
        subtask_id (str): The subtask ID
        is_complete (bool): The completion status
        user_id (str): The user ID

    Returns:
        bool: True if sync was successful
    """
    try:
        # Find the goal that contains this todo_id
        goal = await goals_collection.find_one({"user_id": user_id, "todo_id": todo_id})

        if not goal:
            return False

        # Find and update the specific node by subtask_id
        roadmap = goal.get("roadmap", {})
        nodes = roadmap.get("nodes", [])

        for node in nodes:
            if node.get("data", {}).get("subtask_id") == subtask_id:
                node["data"]["isComplete"] = is_complete
                break
        else:
            return False

        # Update the goal with the modified roadmap
        await goals_collection.update_one(
            {"_id": goal["_id"]}, {"$set": {"roadmap.nodes": nodes}}
        )

        # Invalidate caches
        goal_id = str(goal["_id"])
        cache_key_goal = f"goal_cache:{goal_id}"
        cache_key_goals = f"goals_cache:{user_id}"
        cache_key_stats = f"goal_stats_cache:{user_id}"
        await delete_cache(cache_key_goal)
        await delete_cache(cache_key_goals)
        await delete_cache(cache_key_stats)

        logger.info(
            f"Synced subtask {subtask_id} completion back to goal {goal_id}: {is_complete}"
        )
        return True

    except Exception as e:
        logger.error(f"Error syncing subtask to goal completion: {str(e)}")
        return False


async def update_goal_with_roadmap_service(goal_id: str, roadmap_data: dict) -> bool:
    """
    Update a goal with generated roadmap data, create todo project, and invalidate caches.

    Args:
        goal_id (str): The ID of the goal to update
        roadmap_data (dict): The roadmap data to save

    Returns:
        bool: True if update was successful, False otherwise
    """
    try:
        # Get the goal to find the user_id for cache invalidation
        goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})
        if not goal:
            logger.error(f"Goal {goal_id} not found for roadmap update")
            return False

        user_id = goal.get("user_id")
        goal_title = goal.get("title", "Untitled Goal")

        # Create project and todo with subtasks for the roadmap
        project_id = await create_goal_project_and_todo(
            goal_id, goal_title, roadmap_data, user_id
        )

        # The roadmap has been updated by create_goal_project_and_todo
        # with subtask_ids, so we need to get the updated goal
        updated_goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})

        if updated_goal:
            # Invalidate relevant caches
            if user_id:
                cache_key_goal = f"goal_cache:{goal_id}"
                cache_key_goals = f"goals_cache:{user_id}"
                cache_key_stats = f"goal_stats_cache:{user_id}"
                await delete_cache(cache_key_goal)
                await delete_cache(cache_key_goals)
                await delete_cache(cache_key_stats)
                logger.info(f"Goal caches invalidated for goal {goal_id} and user {user_id}")

            logger.info(
                f"Goal {goal_id} successfully updated with roadmap and todo project {project_id}"
            )
            return True
        else:
            logger.error(f"Failed to update goal {goal_id} with roadmap")
            return False

    except Exception as e:
        logger.error(f"Error updating goal {goal_id} with roadmap: {str(e)}")
        return False
