from fastapi import (
    HTTPException,
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.websockets import WebSocketState
from bson import ObjectId
from db.connect import goals_collection
from datetime import datetime
import json
from typing import Union, List
from services.goals import generate_roadmap_with_llm_stream
from utils.goals import goal_helper, STATIC_USER_ID
from schemas.goals import (
    GoalCreate,
    GoalResponse,
    RoadmapUnavailableResponse,
    UpdateNodeRequest,
)

router = APIRouter()


@router.post("/goals", response_model=GoalResponse)
async def create_goal(goal: GoalCreate):
    goal_data = {
        "title": goal.title,
        "description": goal.description,
        "created_at": str(datetime.now().isoformat()),
        "user_id": STATIC_USER_ID,
        "roadmap": {"nodes": [], "edges": []},
    }

    result = await goals_collection.insert_one(goal_data)
    new_goal = await goals_collection.find_one({"_id": result.inserted_id})
    return goal_helper(new_goal)


@router.get(
    "/goals/{goal_id}", response_model=Union[GoalResponse, RoadmapUnavailableResponse]
)
async def get_goal(goal_id: str):
    try:
        goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})

        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")

        # Check if roadmap is empty
        roadmap = goal.get("roadmap", {})
        if not roadmap.get("nodes") or not roadmap.get("edges"):
            return {
                "message": "Roadmap not available. Please generate it using the WebSocket.",
                "id": goal_id,
                "title": goal["title"],
            }

        return goal_helper(goal)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/goals", response_model=List[GoalResponse])
async def get_user_goals():
    # Fetch all goals for the static user ID
    goals = await goals_collection.find({"user_id": STATIC_USER_ID}).to_list(None)
    return [goal_helper(goal) for goal in goals]


@router.websocket("/ws/roadmap")
async def websocket_generate_roadmap(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            goal_id = data.get("goal_id")
            goal_title = data.get("goal_title")

            if not goal_id or not goal_title:
                await websocket.send_json({"error": "Invalid data received"})
                continue

            await websocket.send_json({"status": "Generating roadmap..."})

            try:
                full_roadmap = ""

                async for chunk in generate_roadmap_with_llm_stream(goal_title):
                    chunk = chunk.replace("data: ", "")  # Remove the 'data: ' prefix

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

                print("Roadmap updated successfully")
                await websocket.send_json(
                    {
                        "status": "Roadmap generated successfully",
                        "roadmap": generated_roadmap,
                    }
                )

                print("Roadmap has been sent")
                if websocket.client_state == WebSocketState.CONNECTED:
                    await websocket.close()

            except Exception as e:
                await websocket.send_json({"error": str(e)})

    except WebSocketDisconnect:
        print("WebSocket disconnected")


@router.delete("/goals/{goal_id}", response_model=GoalResponse)
async def delete_goal(goal_id: str):
    try:
        # Find the goal by its ID
        goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})

        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")

        # Delete the goal
        result = await goals_collection.delete_one({"_id": ObjectId(goal_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=500, detail="Failed to delete the goal")

        # Return the deleted goal's information as a response
        return goal_helper(goal)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/goals/{goal_id}/roadmap/nodes/{node_id}", response_model=GoalResponse)
async def update_node_status(
    goal_id: str, node_id: str, update_data: UpdateNodeRequest
):
    print(update_data, node_id)
    try:
        # Find the goal by its ID
        goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})

        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")

        # Check if the roadmap exists
        roadmap = goal.get("roadmap", {})
        nodes = roadmap.get("nodes", [])

        # Find the node in the roadmap nodes list
        node = next((n for n in nodes if n["id"] == node_id), None)

        if not node:
            raise HTTPException(status_code=404, detail="Node not found in roadmap")

        # Update the node's isComplete status
        node["data"]["isComplete"] = update_data.is_complete

        # Update the roadmap with the modified nodes
        await goals_collection.update_one(
            {"_id": ObjectId(goal_id)}, {"$set": {"roadmap.nodes": nodes}}
        )

        # Return the updated goal
        updated_goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})
        return goal_helper(updated_goal)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
