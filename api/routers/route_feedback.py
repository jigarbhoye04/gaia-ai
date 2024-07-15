from fastapi import APIRouter, HTTPException
from api.database.connect import database
from api.validators.request import FeedbackFormData
router = APIRouter()

@router.post("/submitFeedbackForm")
async def submitFeedbackForm(formData: FeedbackFormData):
    collection = database["feedback_form"]

    try:
        item_dict = formData.dict()
        result = await collection.insert_one(item_dict)

        if result.inserted_id:
            return {"message": "Feedback Form Data inserted successfully"}
        else:
            raise HTTPException(
                status_code=500, detail="Failed to insert feedback form data")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
