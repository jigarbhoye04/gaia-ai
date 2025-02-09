from pydantic import BaseModel, EmailStr
from typing import Optional
from bson import ObjectId


class User(BaseModel):
    id: Optional[ObjectId]
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    # Users inactive until email confirmation
    # is_active: Optional[bool] = False
    is_verified: Optional[bool] = False  # Ensure email confirmation
    created_at: Optional[str]
