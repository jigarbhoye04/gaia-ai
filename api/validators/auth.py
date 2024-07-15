from pydantic import BaseModel, EmailStr, SecretStr,validator
from dotenv import load_dotenv
from fastapi import  Form
import string
import os

load_dotenv()
class LoginData(BaseModel):
    email: EmailStr = Form(...)
    password: SecretStr = Form(...)

class SignupData(BaseModel):
    firstName:str
    lastName:str
    email: EmailStr
    password: SecretStr

    @validator('password')
    def password_complexity(cls, v):
        if not any(c.isupper() for c in v.get_secret_value()):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v.get_secret_value()):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v.get_secret_value()):
            raise ValueError('Password must contain at least one digit')
        if len(v.get_secret_value()) < 8:
            raise ValueError('Password must contain at least 8 characters')
        if not any(char in set(string.punctuation) for char in v.get_secret_value()):
            raise ValueError('Password must contain at least one special character')
        return v
    
    def get_signup_data(
        firstName: str = Form(...),
        lastName: str = Form(...),
        email: EmailStr = Form(...),
        password: SecretStr = Form(...),
    ):
        return SignupData(
            firstName=firstName,
            lastName=lastName,
            email=email,
            password=password
        ).dict()

class TokenSettings(BaseModel):
    authjwt_secret_key: str =  os.getenv('JWT_SECRET_KEY')
    authjwt_token_location: set = {"cookies"}
    authjwt_cookie_csrf_protect: bool = os.getenv('authjwt_cookie_csrf_protect', True) #! CHANGE THIS IN PRODUCTION!