
from fastapi import APIRouter
from api.database.connect import client
from api.validators.request import WaitlistItem
from fastapi import HTTPException

router = APIRouter()

@router.get("/getWaitlistMembers")
async def getWaitlistMembers():
    database = client["gaia-cluster"]
    signups = database["waitlist_signups"]
    emails = set()
    cursor = signups.find()
    members = await cursor.to_list(length=None)

    for member in members:
        emails.add(member['email'])
  
    return {"count": len(emails),"emails":emails}

@router.post("/waitlistSignup")
async def waitlist_signup(item: WaitlistItem):

    database = client["gaia-cluster"]
    collection = database["waitlist_signups"]

    try:
        item_dict = item.dict()
        result = await collection.insert_one(item_dict)

        if result.inserted_id:
            return {"message": "Data inserted successfully"}
        else:
            raise HTTPException(
                status_code=500, detail="Failed to insert data")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))