import os
from utils.util_auth import encode_jwt, authenticate_user, hash_password
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from fastapi import APIRouter, HTTPException, status, Depends, Form, Request
from fastapi.responses import JSONResponse
from pydantic import EmailStr, SecretStr
from dotenv import load_dotenv
from bson import json_util
from pymongo.errors import DuplicateKeyError
import json
from datetime import timedelta, timezone, datetime
from schemas.schema_auth import SignupData, LoginData
from database.connect import users_collection
from utils.util_mongo import serialize_document

load_dotenv()
router = APIRouter()


@router.post("/users")
async def signup(user: SignupData):

    try:
        user_dict = user.model_dump()

        user_dict["hashed_password"] = hash_password(
            user_dict["password"].get_secret_value())
        del user_dict["password"]

        user_dict["created_at"] = datetime.now(timezone.utc)
        user_dict["is_verified"] = False

        await users_collection.insert_one(user_dict)
        return JSONResponse(content={"response": "Successfully created a new account."})

    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="User with this email already exist")

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/auth/login")
async def login(user: LoginData) -> JSONResponse:

    try:
        authenticated_user = await authenticate_user(user.email, str((user.password).get_secret_value()))

        if not authenticated_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )

        if not authenticated_user.get("is_verified", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is not verified. Please verify your email.",
            )

        # expiration = timedelta(minutes=int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES')))
        expiration = timedelta(days=30)
        access_token = encode_jwt(
            data={"sub": str(authenticated_user["_id"])}, expires_delta=expiration)

        serialized_user_data = serialize_document(authenticated_user)
        json_user_data = json_util.dumps(serialized_user_data)

        response = JSONResponse(content=json.loads(json_user_data))

        response.set_cookie(
            key="access_token",
            value=access_token,
            samesite="none",
            secure=True,
            httponly=True,
            expires=datetime.now(timezone.utc) + timedelta(days=60)
        )
        return response

    except HTTPException as httpexc:
        raise httpexc

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# @router.get("/getUserInfo")
    # def is_token_valid(current_user: bool = Depends(is_user_valid)):
    #     return {"response": "Token is valid", "user": current_user}

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# def get_current_user(token: str = Depends(oauth2_scheme)):
#     email = decode_token(token)
#     return email

# def refresh_token(refresh_token: str):
#     try:
#         payload = jwt.decode(
#             refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
#         email = payload.get("sub")
#         if email is None:
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN, detail="Invalid refresh token")
#         return create_access_token({"sub": email})
#     except JWTError:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN, detail="Invalid refresh token")
