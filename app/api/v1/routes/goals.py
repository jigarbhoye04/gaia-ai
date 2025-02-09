import json
from fastapi import HTTPException, APIRouter, WebSocket, WebSocketDisconnect, Depends
from fastapi.websockets import WebSocketState
from bson import ObjectId
from datetime import datetime
from typing import Union, List
from app.db.connect import goals_collection
from app.db.redis import set_cache, delete_cache, get_cache
from app.services.goals import generate_roadmap_with_llm_stream
from app.utils.goals import goal_helper
from app.api.v1.dependencies.auth import get_current_user
from app.utils.logging import get_logger
from app.schemas.goals import (
    GoalCreate,
    GoalResponse,
    RoadmapUnavailableResponse,
    UpdateNodeRequest,
)

logger = get_logger(name="goals", log_file="goals.log")


router = APIRouter()


@router.post(
    "/goals",
    response_model=GoalResponse,
    summary="Create a goal",
    description="Creates a new goal for the authenticated user.",
)
async def create_goal(goal: GoalCreate, user: str = Depends(get_current_user)):
    """
    Create a new goal.
    """
    user_id = user.get("user_id")
    if not user_id:
        logger.warning("Unauthorized attempt to create a goal.")
        raise HTTPException(status_code=403, detail="Not authenticated")

    goal_data = {
        "title": goal.title,
        "description": goal.description,
        "created_at": str(datetime.now().isoformat()),
        "user_id": user_id,
        "roadmap": {"nodes": [], "edges": []},
    }

    result = await goals_collection.insert_one(goal_data)
    new_goal = await goals_collection.find_one({"_id": result.inserted_id})

    cache_key = f"goals_cache:{user_id}"
    await delete_cache(cache_key)

    logger.info(f"Goal created successfully: {new_goal['_id']} by user {user_id}")
    return goal_helper(new_goal)


@router.get(
    "/goals/{goal_id}",
    response_model=Union[GoalResponse, RoadmapUnavailableResponse],
    summary="Get goal details",
    description="Fetch the details of a specific goal using its ID.",
)
async def get_goal(goal_id: str, user: str = Depends(get_current_user)):
    """
    Retrieve a goal by its ID.
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

    await set_cache(cache_key, json.dumps(goal_helper(goal)))
    logger.info(f"Goal {goal_id} details fetched successfully.")
    return goal_helper(goal)


@router.get(
    "/goals",
    response_model=List[GoalResponse],
    summary="List all goals",
    description="Fetch all goals for the authenticated user.",
)
async def get_user_goals(user: str = Depends(get_current_user)):
    """
    List all goals for the current user.
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


@router.websocket("/ws/roadmap")
async def websocket_generate_roadmap(websocket: WebSocket):
    """
    WebSocket for generating roadmaps.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()

            goal_id = data.get("goal_id")
            goal_title = data.get("goal_title")

            if not goal_id or not goal_title:
                logger.warning(
                    "Invalid data received in websocket for roadmap generation."
                )
                await websocket.send_json({"error": "Invalid data received"})
                continue

            logger.info(
                f"Starting roadmap generation for goal {goal_id} titled '{goal_title}'."
            )
            await websocket.send_json({"status": "Generating roadmap..."})

            try:
                full_roadmap = ""

                async for chunk in generate_roadmap_with_llm_stream(goal_title):
                    chunk = chunk.replace("data: ", "")

                    if chunk.strip() != "[DONE]":
                        full_roadmap += json.loads(chunk).get("response", "")
                        await websocket.send_text(chunk)
                    else:
                        break

                generated_roadmap = json.loads(full_roadmap)

                await goals_collection.update_one(
                    {"_id": ObjectId(goal_id)},
                    {"$set": {"roadmap": generated_roadmap}},
                )

                await websocket.send_json(
                    {
                        "status": "Roadmap generated successfully",
                        "roadmap": generated_roadmap,
                    }
                )

                if websocket.client_state == WebSocketState.CONNECTED:
                    await websocket.close()

                logger.info(f"Roadmap generation for goal {goal_id} completed.")

            except Exception as e:
                logger.error(
                    f"Error occurred while generating roadmap for goal {goal_id}: {str(e)}"
                )
                await websocket.send_json({"error": str(e)})

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")


@router.delete(
    "/goals/{goal_id}",
    response_model=GoalResponse,
    summary="Delete a goal",
    description="Deletes a specific goal using its ID.",
)
async def delete_goal(goal_id: str, user: str = Depends(get_current_user)):
    """
    Delete a goal by its ID.
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


@router.patch(
    "/goals/{goal_id}/roadmap/nodes/{node_id}",
    response_model=GoalResponse,
    summary="Update node status",
    description="Updates the completion status of a node in the roadmap.",
)
async def update_node_status(
    goal_id: str,
    node_id: str,
    update_data: UpdateNodeRequest,
    user: str = Depends(get_current_user),
):
    """
    Update the status of a node in the roadmap.
    """
    try:
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

    except Exception as e:
        logger.error(f"Error occurred while updating node status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
