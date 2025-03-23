import json
from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException

from app.db.collections import goals_collection
from app.db.db_redis import ONE_YEAR_TTL, delete_cache, get_cache, set_cache
from app.models.goals_models import GoalCreate, UpdateNodeRequest, GoalResponse
from app.services.llm_service import do_prompt_no_stream, do_prompt_with_stream
from app.utils.goals_utils import goal_helper
from app.config.loggers import goals_logger as logger
from app.prompts.user.goals_prompts import (
    ROADMAP_JSON_STRUCTURE,
    ROADMAP_INSTRUCTIONS,
    ROADMAP_GENERATOR,
)


async def generate_roadmap_with_llm(title: str) -> dict:
    detailed_prompt = ROADMAP_GENERATOR.format(
        title=title,
        instructions=ROADMAP_INSTRUCTIONS,
        json_structure=ROADMAP_JSON_STRUCTURE,
    )

    try:
        response = await do_prompt_no_stream(prompt=detailed_prompt, max_tokens=2048)
        return response
    except Exception as e:
        print(f"LLM Generation Error: {e}")
        return {}


async def generate_roadmap_with_llm_stream(title: str):
    detailed_prompt = ROADMAP_GENERATOR.format(
        title=title,
        instructions=ROADMAP_INSTRUCTIONS,
        json_structure=ROADMAP_JSON_STRUCTURE,
    )

    try:
        async for chunk in do_prompt_with_stream(
            messages=[{"role": "user", "content": detailed_prompt}],
            max_tokens=4096,
        ):
            yield chunk

    except Exception as e:
        print(f"LLM Generation Error: {e}")
        yield json.dumps({"error": str(e)})


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
        return GoalResponse(**new_goal)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create goal")


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
        return json.loads(cached_goal)

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

    await set_cache(cache_key, json.dumps(goal_helper(goal)), ONE_YEAR_TTL)
    logger.info(f"Goal {goal_id} details fetched successfully.")
    return goal_helper(goal)


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
        return json.loads(cached_goals)

    goals = await goals_collection.find({"user_id": user_id}).to_list(None)
    goals_list = [goal_helper(goal) for goal in goals]

    await set_cache(cache_key, json.dumps(goals_list))
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
    await delete_cache(cache_key_goal)
    await delete_cache(cache_key_goals)

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
    updated_goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})

    cache_key_goal = f"goal_cache:{goal_id}"
    cache_key_goals = f"goals_cache:{user_id}"
    await delete_cache(cache_key_goal)
    await delete_cache(cache_key_goals)

    logger.info(f"Node status updated for node {node_id} in goal {goal_id}.")
    return goal_helper(updated_goal)
