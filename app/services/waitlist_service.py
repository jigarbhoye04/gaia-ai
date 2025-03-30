"""
Waitlist service functions for the GAIA API.

This module contains service functions related to the waitlist functionality of the GAIA API.
"""

from app.db.collections import waitlist_collection
from app.db.utils import serialize_document
from app.models.general_models import WaitlistItem
from fastapi import HTTPException, Request


async def get_waitlist_members_service():
    """
    Retrieve the list of waitlist members from the database.

    Returns:
        dict: A dictionary containing the count, emails, and formatted waitlist members.
    """
    cursor = waitlist_collection.find()
    members = await cursor.to_list(length=None)

    cleaned_members = []
    emails = set()

    for member in members:
        serialized = serialize_document(member)

        cleaned_member = {k: v for k, v in serialized.items() if v is not None}

        email = cleaned_member.get("email")
        if email and email not in emails:
            emails.add(email)
            cleaned_members.append(cleaned_member)

    return {"count": len(emails), "emails": list(emails), "members": cleaned_members}


async def waitlist_signup_service(
    item: WaitlistItem,
    request: Request = None,
):
    """
    Sign up a new member to the waitlist and insert their information into the database.
    Prevents duplicate emails from being added.

    Args:
        item (WaitlistItem): The waitlist item containing the member's information.
        request (Request, optional): The FastAPI request object for extracting client info.

    Returns:
        dict: A message indicating the result of the signup operation.

    Raises:
        HTTPException: If there is an error during the signup process.
    """
    try:
        # Check if email already exists in the waitlist
        email = item.email
        existing_entry = await waitlist_collection.find_one({"email": email})

        if existing_entry:
            return {"message": "Email already registered in the waitlist"}

        item_dict = item.model_dump()
        item_dict.update({"ip": request.client.host if request.client else "Unknown"})

        result = await waitlist_collection.insert_one(item_dict)

        if result.inserted_id:
            return {"message": "Data inserted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to insert data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def clean_and_update_waitlist_members():
    """
    Fetch all waitlist members, clean their data to match the WaitlistItem model,
    update the database to remove extra fields, ensure missing fields are set to None,
    and remove duplicate email entries keeping only the most recent one.

    Returns:
        dict: A summary of the cleaning process, including count of updated records
              and removed duplicates.
    """
    try:
        cursor = waitlist_collection.find()
        members = await cursor.to_list(length=None)

        waitlist_fields = set(WaitlistItem.model_fields.keys())
        updated_count = 0
        email_map = {}
        duplicates = []

        for member in members:
            member_id = member["_id"]
            email = member.get("email")

            if not email:
                continue

            if email in email_map:
                if member_id > email_map[email]:
                    duplicates.append(email_map[email])
                    email_map[email] = member_id
                else:
                    duplicates.append(member_id)
            else:
                email_map[email] = member_id

        for member in members:
            member_id = member["_id"]

            if member_id in duplicates:
                continue

            cleaned_member = {
                field: member.get(field, None) for field in waitlist_fields
            }

            await waitlist_collection.update_one(
                {"_id": member_id},
                {
                    "$set": cleaned_member,
                    "$unset": {
                        k: "" for k in member if k not in waitlist_fields and k != "_id"
                    },
                },
            )

            updated_count += 1

        if duplicates:
            delete_result = await waitlist_collection.delete_many(
                {"_id": {"$in": duplicates}}
            )
            deleted_count = delete_result.deleted_count
        else:
            deleted_count = 0

        return {
            "message": "Waitlist data cleaned and updated",
            "updated_count": updated_count,
            "duplicates_removed": deleted_count,
            "unique_emails": len(email_map),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
