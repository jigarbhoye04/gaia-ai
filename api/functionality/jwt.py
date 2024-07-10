import jwt
from typing import Dict
import datetime
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

"""Create access / refresh tokens token"""
def create_access_token(
        user_id: str,
        is_refresh_token:bool = False
    ) -> Dict[str, str]:
    
    minutes: int =  os.getenv('REFRESH_TOKEN_EXPIRE_MINUTES',15) if is_refresh_token else os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES',60 * 24 * 7)
    
    expiration = datetime.utcnow() + timedelta(minutes=minutes)

    payload = {"user_id": user_id, "expires": expiration}

    encoded_jwt = jwt.encode(payload, os.getenv('JWT_SECRET_KEY'), algorithm=os.getenv('JWT_ALGORITHM'))

    return {"access_token": encoded_jwt}
