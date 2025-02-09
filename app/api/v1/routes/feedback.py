from fastapi import APIRouter, HTTPException
from app.db.collections import feedback_collection
from app.models.general_models import FeedbackFormData

router = APIRouter()


@router.post("/feedback")
async def submit_feedback_form(form_data: FeedbackFormData):
    try:
        item_dict = form_data.dict()
        result = await feedback_collection.insert_one(item_dict)

        if result.inserted_id:
            return {"message": "Feedback Form Data inserted successfully"}
        else:
            raise HTTPException(
                status_code=500, detail="Failed to insert feedback form data"
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
