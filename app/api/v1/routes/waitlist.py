from fastapi import APIRouter
from app.models.general_models import WaitlistItem
from app.services.waitlist_service import get_waitlist_members_service, waitlist_signup_service

router = APIRouter()


@router.get("/waitlist-members")
async def get_waitlist_members():
    return await get_waitlist_members_service()


@router.post("/waitlist-members")
async def waitlist_signup(item: WaitlistItem):
    return await waitlist_signup_service(item)
