import os
from datetime import datetime, timedelta
from jose import jwt, JWTError
from google.oauth2 import id_token
from google.auth.transport import requests
from bson import ObjectId  # Ensure you have pymongo/bson installed

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 30
ACCESS_TOKEN_SECRET_KEY = os.environ.get("ACCESS_TOKEN_SECRET_KEY", "access_secret")
REFRESH_TOKEN_SECRET_KEY = os.environ.get("REFRESH_TOKEN_SECRET_KEY", "refresh_secret")


def google_authenticate(google_token: str) -> dict:
    try:
        idinfo = id_token.verify_oauth2_token(google_token, requests.Request())
        return {
            "sub": idinfo.get("sub"),
            "email": idinfo.get("email"),
            "email_verified": idinfo.get("email_verified"),
            "name": idinfo.get("name"),
            "picture": idinfo.get("picture"),
            "given_name": idinfo.get("given_name"),
        }
    except ValueError as e:
        raise Exception("Invalid Google token") from e


def convert_to_serializable(obj):
    """
    Recursively convert non-JSON-serializable objects in a data structure
    (such as ObjectId or datetime) into JSON-serializable types.
    """
    if isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, datetime):
        return obj.isoformat()
    return obj


def create_access_token(user_data: dict) -> str:
    # Make a shallow copy to avoid modifying the original data.
    user_data = user_data.copy()

    # Convert MongoDB ObjectId in the root (if present) to a string.
    if "_id" in user_data:
        user_data["id"] = str(user_data["_id"])
        del user_data["_id"]

    # Recursively convert any nested non-serializable values.
    user_data = convert_to_serializable(user_data)

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = user_data.copy()
    # The JWT spec requires "exp" to be a numeric timestamp.
    payload.update({"exp": int(expire.timestamp()), "type": "access"})
    return jwt.encode(payload, ACCESS_TOKEN_SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_data: dict) -> str:
    user_data = user_data.copy()
    if "_id" in user_data:
        user_data["id"] = str(user_data["_id"])
        del user_data["_id"]

    user_data = convert_to_serializable(user_data)
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = user_data.copy()
    payload.update({"exp": int(expire.timestamp()), "type": "refresh"})
    return jwt.encode(payload, REFRESH_TOKEN_SECRET_KEY, algorithm=ALGORITHM)


def create_tokens(user_data: dict) -> dict:
    return {
        "access_token": create_access_token(user_data),
        "refresh_token": create_refresh_token(user_data),
    }


def verify_refresh_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, REFRESH_TOKEN_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise Exception("Invalid token type")
        return payload
    except JWTError as e:
        raise Exception("Invalid refresh token") from e
