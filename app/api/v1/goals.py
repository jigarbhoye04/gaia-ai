from fastapi import HTTPException, APIRouter
from pydantic import BaseModel
from bson import ObjectId
from typing import List, Optional
from db.connect import goals_collection
from datetime import datetime
from services.llm import doPromptNoStream
import json

router = APIRouter()

STATIC_USER_ID = "user123"


class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = ""


class GoalResponse(BaseModel):
    id: str
    title: str
    description: str
    roadmap: dict
    user_id: str
    created_at: str


def goal_helper(goal) -> dict:
    created_at = goal["created_at"]
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()

    return {
        "id": str(goal["_id"]),
        "title": goal["title"],
        "description": goal.get("description", ""),
        "created_at": goal["created_at"],
        "roadmap": {
            "nodes": goal.get("roadmap", {}).get("nodes", []),
            "edges": goal.get("roadmap", {}).get("edges", []),
        },
        "user_id": goal.get("user_id", STATIC_USER_ID),
    }


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


async def generate_roadmap_with_llm(title: str) -> dict:
    """
    Generate roadmap using OpenAI or another LLM
    Returns a dictionary with nodes and edges
    """

    jsonstructure = {
        "nodes": [
            {
                "id": "node1",
                "data": {"label": "Child 1"},
                "position": {"x": 0, "y": 0},
            },
            {
                "id": "node2",
                "data": {"label": "Child 2"},
                "position": {"x": 100, "y": 100},
            },
        ],
        "edges": [
            {
                "id": "e1-2",
                "source": "node1",
                "target": "node2",
            }
        ],
    }

    ### Node Structure:
    # 1. **Label**: A concise title summarizing the milestone.
    # 2. **Details**: A list of 3-5 actionable, specific tasks required to complete the milestone.
    # 3. **Estimated Time**: A time estimate for completing the milestone (e.g., "2 weeks", "1 month").
    # 4. **Resources**: A list of at least 2-4 high-quality resources (books, courses, tools, or tutorials) to assist with the milestone.

    ### Edge Structure:
    # 1. **Type**: The relationship type (e.g., "progression", "prerequisite", "application").
    # 2. **Description**: A brief explanation of how the source node connects to the target node.

    detailed_prompt = f"""
    You are an expert roadmap planner. Your task is to generate a highly detailed roadmap in the form of a JSON object. 
    
    The roadmap is for the following title: **{title}**.

    The roadmap must include **15-20 nodes** representing key milestones.

    ### Requirements:
    1. The roadmap must cover a progression from beginner to expert levels, with logically ordered steps.
    2. The Roadmap should be in a vertical tree like structure.
    3. Each node should have good spacing between them.  The y and x positions should be separataed by values of at least 100
    4. Include dependencies between nodes in the form of edges.
    5. Ensure the JSON is valid and follows this structure:

    {{ {jsonstructure} }}
    
        Respond **only** with the JSON object, with no extra text or explanations.
    """

    try:
        response = doPromptNoStream(prompt=detailed_prompt, max_tokens=2048)
        return response.get("response", {})

    except Exception as e:
        print(f"LLM Generation Error: {e}")
        return {}


@router.get("/goals/{goal_id}", response_model=GoalResponse)
async def get_goal(goal_id: str):
    try:
        goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})

        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")

        # Check if roadmap is empty
        roadmap = goal.get("roadmap", {})
        if not roadmap.get("nodes") or not roadmap.get("edges"):
            generated_roadmap = await generate_roadmap_with_llm(
                goal["title"],
            )

            print(goal["title"], generated_roadmap)

            await goals_collection.update_one(
                {"_id": ObjectId(goal_id)},
                {"$set": {"roadmap": json.loads(generated_roadmap)}},
            )

            # Refresh goal with updated roadmap
            goal = await goals_collection.find_one({"_id": ObjectId(goal_id)})

        return goal_helper(goal)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/goals", response_model=List[GoalResponse])
async def get_user_goals():
    # Fetch all goals for the static user ID
    goals = await goals_collection.find({"user_id": STATIC_USER_ID}).to_list(None)
    return [goal_helper(goal) for goal in goals]
