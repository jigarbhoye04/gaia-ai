from datetime import datetime, timezone

from app.db.collections import users_collection

async def store_user_info(name: str, email: str, picture: str):
    existing_user = await users_collection.find_one({"email": email})

    if existing_user:
        # Update user info if user already exists
        await users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "name": name,
                    "picture": picture,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return existing_user["_id"]
    else:
        # Insert new user if they don't exist
        user_data = {
            "name": name,
            "email": email,
            "picture": picture,
            "created_at": datetime.now(timezone.utc),
        }
        result = await users_collection.insert_one(user_data)
        return result.inserted_id
