from fastapi import APIRouter, HTTPException
from app.db.collections import waitlist_collection
from app.models.general_models import WaitlistItem

router = APIRouter()


@router.get("/waitlist-members")
async def getWaitlistMembers():
    emails = set()
    cursor = waitlist_collection.find()
    members = await cursor.to_list(length=None)

    for member in members:
        emails.add(member["email"])

    return {"count": len(emails), "emails": emails}


@router.post("/waitlist-members")
async def waitlist_signup(item: WaitlistItem):

    try:
        item_dict = item.dict()
        result = await waitlist_collection.insert_one(item_dict)

        if result.inserted_id:
            return {"message": "Data inserted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to insert data")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
