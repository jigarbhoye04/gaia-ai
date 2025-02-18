# app/services/auth.py
import os
from datetime import datetime, timedelta, timezone

from jose import jwt

from app.db.collections import users_collection

SECRET_KEY = os.environ.get("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 30))


async def get_or_create_user(user_info: dict) -> dict:
    """
    Retrieve a user from the database using Google user info.
    If the user does not exist, create a new user.

    :param user_info: Dictionary containing user information from Google.
                      Expected keys: "email", "name", "sub" (Google ID).
    :return: User dictionary with the stringified '_id'.
    """
    user = await users_collection.find_one({"email": user_info["email"]})
    if user:
        user["_id"] = str(user["_id"])
        return user
    else:
        user_data = {
            "email": user_info["email"],
            "name": user_info.get("name"),
            "google_id": user_info.get("sub"),
            "created_at": datetime.utcnow(),
        }
        result = await users_collection.insert_one(user_data)
        user_data["_id"] = str(result.inserted_id)
        return user_data


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Create a JWT access token.

    :param data: Data to include in the token (e.g., user ID as "sub").
    :param expires_delta: Token expiry duration.
    :return: Encoded JWT token as a string.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


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
