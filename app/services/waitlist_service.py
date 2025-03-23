"""
Waitlist service functions for the GAIA API.

This module contains service functions related to the waitlist functionality of the GAIA API.
"""

from app.db.collections import waitlist_collection
from app.models.general_models import WaitlistItem
from fastapi import HTTPException


async def get_waitlist_members_service():
    """
    Retrieve the list of waitlist members from the database.

    Returns:
        dict: A dictionary containing the count and emails of waitlist members.
    """
    emails = set()
    cursor = waitlist_collection.find()
    members = await cursor.to_list(length=None)

    for member in members:
        emails.add(member["email"])

    return {"count": len(emails), "emails": emails}


async def waitlist_signup_service(item: WaitlistItem):
    """
    Sign up a new member to the waitlist and insert their information into the database.

    Args:
        item (WaitlistItem): The waitlist item containing the member's information.

    Returns:
        dict: A message indicating the result of the signup operation.

    Raises:
        HTTPException: If there is an error during the signup process.
    """
    try:
        item_dict = item.dict()
        result = await waitlist_collection.insert_one(item_dict)

        if result.inserted_id:
            return {"message": "Data inserted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to insert data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
