from fastapi import FastAPI, HTTPException, APIRouter
from pydantic import BaseModel
from bson import ObjectId
from typing import List
from db.connect import goals_collection
from datetime import datetime, timezone

router = APIRouter()

STATIC_USER_ID = "user123"


class GoalCreate(BaseModel):
    title: str


class GoalUpdate(BaseModel):
    nodes: List[dict]
    edges: List[dict]


class GoalResponse(BaseModel):
    id: str
    title: str
    nodes: List[dict]
    edges: List[dict]
    user_id: str


def goal_helper(goal) -> dict:
    return {
        "id": str(goal["_id"]),
        "title": goal["title"],
        "roadmap": {
            "nodes": goal.get("nodes", []),
            "edges": goal.get("edges", []),
        },
        "description": goal["description"],
        "user_id": goal.get("user_id", STATIC_USER_ID),
    }


@router.post("/goals", response_model=GoalResponse)
async def create_goal(title: str):
    goal_data = {"title": title, "created_at": datetime.now(timezone.utc)}
    result = await goals_collection.insert_one(goal_data)
    new_goal = await goals_collection.find_one({"_id": result.inserted_id})

    return {
        "id": str(new_goal["_id"]),
        "title": new_goal["title"],
        "created_at": new_goal["created_at"],
    }


@router.put("/goals/{goal_id}", response_model=GoalResponse)
async def update_goal(goal_id: str, goal_update: GoalUpdate):
    # Find the goal by ID
    goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Update the goal with nodes and edges
    update_data = {
        "$set": {
            "nodes": goal_update.nodes,
            "edges": goal_update.edges,
        }
    }
    await goals_collection.update_one({"_id": ObjectId(goal_id)}, update_data)
    updated_goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})
    return goal_helper(updated_goal)


# 3. Route to fetch all goals for a user
@router.get("/goals", response_model=List[GoalResponse])
async def get_user_goals():
    # Fetch all goals for the static user ID
    goals = await goals_collection.find({"user_id": STATIC_USER_ID}).to_list(None)
    return [goal_helper(goal) for goal in goals]
