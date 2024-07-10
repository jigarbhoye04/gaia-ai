from pydantic import BaseModel, EmailStr, SecretStr,validator
import string

class LoginData(BaseModel):
    email: EmailStr
    password: SecretStr


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

class Token(BaseModel):
    token:str
