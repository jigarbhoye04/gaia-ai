import jwt
from typing import Dict
from datetime import timedelta, datetime, timezone
import os
from dotenv import load_dotenv
from fastapi import HTTPException, status
load_dotenv()


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        to_encode.update({"exp": expire})

        jwt_secret_key = os.getenv('JWT_SECRET_KEY')
        jwt_algorithm = os.getenv('JWT_ALGORITHM')
            
        if not jwt_secret_key or not jwt_algorithm:
            raise ValueError("JWT secret key or algorithm not configured")

        encoded_jwt = jwt.encode(to_encode, jwt_secret_key, algorithm=jwt_algorithm)
        return encoded_jwt.decode("utf-8")
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Token creation error: {str(e)}")


# def create_refresh_token(user_id: str) -> str:
#     try:
#         expiration_days = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', 30))
#         expiration = datetime.now(timezone.utc) + timedelta(days=expiration_days)
#         payload = {"sub": user_id, "type": "refresh_token", "exp": expiration}
#         jwt_secret_key = os.getenv('JWT_SECRET_KEY')
#         jwt_algorithm = os.getenv('JWT_ALGORITHM')
        
#         if not jwt_secret_key or not jwt_algorithm:
#             raise ValueError("JWT secret key or algorithm not configured")
        
#         encoded_jwt = jwt.encode(payload, jwt_secret_key, algorithm=jwt_algorithm)
#         return encoded_jwt
#     except Exception as e:
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Token creation error: {str(e)}")


def decode_jwt(token: str) -> dict:
    try:

        jwt_secret_key = os.getenv('JWT_SECRET_KEY')
        jwt_algorithm = os.getenv('JWT_ALGORITHM')
            
        if not jwt_secret_key or not jwt_algorithm:
            raise ValueError("JWT secret key or algorithm not configured")

        return jwt.decode(token, jwt_secret_key, algorithms=[jwt_algorithm])
    
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal server error occurred: {str(e)}")
