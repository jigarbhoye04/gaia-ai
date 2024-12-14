from fastapi import HTTPException, APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from bson import ObjectId
from typing import List, Optional
from db.connect import goals_collection
from datetime import datetime
from services.llm import doPromptNoStreamAsync, doPromptWithStreamAsync
import json
from typing import Union
import json

router = APIRouter()

STATIC_USER_ID = "user123"


class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = ""


class GoalResponse(BaseModel):
    id: str
    title: str
    progress: int
    description: str
    roadmap: dict
    user_id: str
    created_at: str


class RoadmapUnavailableResponse(BaseModel):
    message: str
    id: str
    title: str


def goal_helper(goal) -> dict:
    created_at = goal["created_at"]
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()

    nodes = goal.get("roadmap", {}).get("nodes", [])
    completed_nodes = len(
        [node for node in nodes if node.get("data", {}).get("isComplete", False)]
    )
    total_nodes = len(nodes)
    progress = int((completed_nodes / total_nodes) * 100) if total_nodes > 0 else 0
    print(progress)
    return {
        "id": str(goal["_id"]),
        "title": goal["title"],
        "description": goal.get("description", ""),
        "created_at": goal["created_at"],
        "progress": progress,
        "roadmap": {
            "title": goal.get("roadmap", {}).get("title", ""),
            "description": goal.get("roadmap", {}).get("description", ""),
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


jsonstructure = {
    "title": "Title of the goal",
    "description": "A short description",
    "nodes": [
        {
            "id": "node1",
            "data": {
                "label": "Child 1",
                "details": ["detail1", "detail2"],
                "estimatedTime": "...",
                "resources": ["resource1", "resource2"],
            },
        },
        {
            "id": "node2",
            "data": {
                "label": "Child 2",
                "details": ["detail1", "detail2"],
                "estimatedTime": "...",
                "resources": ["resource1", "resource2"],
            },
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

### Edge Structure:
# 1. **Type**: The relationship type (e.g., "progression", "prerequisite", "application").
# 2. **Description**: A brief explanation of how the source node connects to the target node.


async def generate_roadmap_with_llm(title: str) -> dict:
    detailed_prompt = f"""
    You are an expert roadmap planner. Your task is to generate a highly detailed roadmap in the form of a JSON object. 

    The roadmap is for the following title: **{title}**.

    The roadmap must include **15-20 nodes** representing key milestones.

    ### Node Structure:
    # 1. **Label**: A concise title summarizing the milestone.
    # 2. **Details**: A list of 3-5 actionable, specific tasks required to complete the milestone.
    # 3. **Estimated Time**: A time estimate for completing the milestone (e.g., "2 weeks", "1 month").
    # 4. **Resources**: A list of at least 2-4 high-quality resources (books, courses, tools, or tutorials) to assist with the milestone.

    ### Requirements:
    1. The roadmap must cover a progression from beginner to expert levels, with logically ordered steps.
    2. The Roadmap should be in a vertical tree like structure.
    3. Only add resources where applicable.
    4. Make sure that the estimated time makes sense for the node. Estimated times should be realistic.
    5. Include dependencies between nodes in the form of edges.
    6. Ensure the JSON is valid and follows this structure:

    {{ {jsonstructure} }}

        Respond **only** with the JSON object, with no extra text or explanations.
    """

    try:
        response = await doPromptNoStreamAsync(prompt=detailed_prompt, max_tokens=2048)
        return json.loads(response)
        # return response.get("response", "{}")
    except Exception as e:
        print(f"LLM Generation Error: {e}")
        return "{}"


# 3. **Estimated Time**: A time estimate for completing the milestone (e.g., "2 weeks", "1 month").
async def generate_roadmap_with_llm_stream(title: str):
    detailed_prompt = f"""
    You are an expert roadmap planner. Your task is to generate a highly detailed roadmap in the form of a JSON object. 

    The roadmap is for the following title: **{title}**.

    The roadmap must include **10-15 nodes** representing key milestones.

    ### Node Structure:
    1. **Label**: A concise title summarizing the milestone.
    2. **Details**: A list of 3-5 actionable, specific tasks required to complete the milestone. Keep the length short and concise.
    4. **Resources**: A list of at least 2-4 high-quality resources (books, courses, tools, or tutorials) to assist with the milestone.

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
        async for chunk in doPromptWithStreamAsync(
            prompt=detailed_prompt, max_tokens=2048
        ):
            yield chunk

    except Exception as e:
        print(f"LLM Generation Error: {e}")
        yield json.dumps({"error": str(e)})


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

                print("updated one")
                await websocket.send_json(
                    {
                        "status": "Roadmap generated successfully",
                        "roadmap": generated_roadmap,
                    }
                )

                print("sent json")

            except Exception as e:
                await websocket.send_json({"error": str(e)})

    except WebSocketDisconnect:
        print("WebSocket disconnected")


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


class UpdateNode(BaseModel):
    is_complete: bool


@router.patch("/goals/{goal_id}/roadmap/nodes/{node_id}", response_model=GoalResponse)
async def update_node_status(goal_id: str, node_id: str, update_data: UpdateNode):
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
