from pydantic import BaseModel, EmailStr, SecretStr
from typing import Optional


class SignupData(BaseModel):
    email: EmailStr
    password: SecretStr
    first_name: str
    last_name: str


class LoginData(BaseModel):
    email: EmailStr
    password: SecretStr


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[EmailStr] = None
