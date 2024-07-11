import jwt
from typing import Dict
from datetime import timedelta, datetime, timezone
import os
from dotenv import load_dotenv
from fastapi import HTTPException, status
load_dotenv()

"""Create access/refresh tokens"""
def create_access_token(user_id: str) -> str:
    try:
        expiration_minutes = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', 15))
        expiration = datetime.now(timezone.utc) + timedelta(minutes=expiration_minutes)
        payload = {"user_id": user_id, "exp": expiration}
        jwt_secret_key = os.getenv('JWT_SECRET_KEY')
        jwt_algorithm = os.getenv('JWT_ALGORITHM')
        
        if not jwt_secret_key or not jwt_algorithm:
            raise ValueError("JWT secret key or algorithm not configured")
        
        encoded_jwt = jwt.encode(payload, jwt_secret_key, algorithm=jwt_algorithm)
        return encoded_jwt
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Token creation error: {str(e)}")



def decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, os.getenv('JWT_SECRET_KEY'), algorithms=[os.getenv('JWT_ALGORITHM')])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal server error occurred: {str(e)}")
