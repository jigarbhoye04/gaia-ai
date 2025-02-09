import os
import re
from datetime import timedelta, datetime, timezone
from re import Match

from fastapi import HTTPException, status
from dotenv import load_dotenv
from passlib.context import CryptContext
import jwt
from app.db.collections import users_collection

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
load_dotenv()


GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def validate_password(password: str) -> Match[str] | None:
    # Strong password regex: minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    return re.match(
        r"^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$", password
    )


def encode_jwt(data: dict, expires_delta: timedelta | None = None):
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        to_encode.update({"exp": expire})

        jwt_secret_key = os.getenv("JWT_SECRET_KEY")
        jwt_algorithm = os.getenv("JWT_ALGORITHM")

        if not jwt_secret_key or not jwt_algorithm:
            raise ValueError("JWT secret key or algorithm not configured")

        encoded_jwt = jwt.encode(to_encode, jwt_secret_key, algorithm=jwt_algorithm)
        return encoded_jwt

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token creation error: {str(e)}",
        )


def decode_jwt(token: str) -> dict:
    try:
        jwt_secret_key = os.getenv("JWT_SECRET_KEY")
        jwt_algorithm = os.getenv("JWT_ALGORITHM")

        if not jwt_secret_key or not jwt_algorithm:
            raise ValueError("JWT secret key or algorithm not configured")

        return jwt.decode(token, jwt_secret_key, algorithms=[jwt_algorithm])

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error occurred: {str(e)}",
        )


# def create_refresh_token(data: dict, expires_delta: timedelta = None):
#     to_encode = data.copy()
#     expire = datetime.utcnow() + \
#         expires_delta if expires_delta else timedelta(
#             days=REFRESH_TOKEN_EXPIRE_DAYS)
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)


async def authenticate_user(email: str, password: str):
    user = await users_collection.find_one({"email": email})
    if not user or not verify_password(password, user["hashed_password"]):
        return False
    else:
        return user
