from fastapi import HTTPException

from app.db.mongodb.collections import feedback_collection
from app.models.general_models import FeedbackFormData


async def submit_feedback(form_data: FeedbackFormData) -> dict:
    """
    Submit feedback form data to the database.

    Args:
        form_data (FeedbackFormData): The feedback form data.

    Returns:
        dict: A message indicating the result of the operation.

    Raises:
        HTTPException: If the feedback form data insertion fails.
    """
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
