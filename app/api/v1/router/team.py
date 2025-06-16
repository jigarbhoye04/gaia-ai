from typing import List
from fastapi import APIRouter, HTTPException, status
from fastapi.encoders import jsonable_encoder
from app.db.collections import team_collection
from app.models.team_models import TeamMemberCreate, TeamMemberUpdate, TeamMember

router = APIRouter()


@router.get("/team", response_model=List[TeamMember])
async def get_team_members():
    """Get all team members."""
    members = await team_collection.find().to_list(100)
    return members


@router.get("/team/{member_id}", response_model=TeamMember)
async def get_team_member(member_id: str):
    """Get a specific team member by ID."""
    member = await team_collection.find_one({"_id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return member


@router.post("/team", response_model=TeamMember, status_code=status.HTTP_201_CREATED)
async def create_team_member(member: TeamMemberCreate):
    """Create a new team member."""
    member_data = jsonable_encoder(member)
    result = await team_collection.insert_one(member_data)
    created_member = await team_collection.find_one({"_id": result.inserted_id})
    return created_member


@router.put("/team/{member_id}", response_model=TeamMember)
async def update_team_member(member_id: str, member: TeamMemberUpdate):
    """Update a team member."""
    update_data = {k: v for k, v in member.dict().items() if v is not None}
    if update_data:
        result = await team_collection.update_one({"_id": member_id}, {"$set": update_data})
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Team member not found")
    updated_member = await team_collection.find_one({"_id": member_id})
    if not updated_member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return updated_member


@router.delete("/team/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team_member(member_id: str):
    """Delete a team member."""
    result = await team_collection.delete_one({"_id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team member not found")
    return