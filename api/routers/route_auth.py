from fastapi import HTTPException
from utils.util_auth import encode_jwt, authenticate_user, hash_password
from fastapi import APIRouter, status, Depends, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from bson import json_util, ObjectId
from pymongo.errors import DuplicateKeyError
import json
from datetime import timedelta, timezone, datetime
from schemas.schema_auth import SignupData, LoginData
from middleware.middleware_auth import get_current_user
from database.connect import users_collection

load_dotenv()
router = APIRouter()


@router.post("/users")
async def signup(user: SignupData):
    """Create new Account for user"""

    try:
        user_dict = user.model_dump()

        user_dict["hashed_password"] = hash_password(
            user_dict["password"].get_secret_value()
        )
        del user_dict["password"]

        user_dict["created_at"] = datetime.now(timezone.utc)
        # user_dict["is_verified"] = False

        await users_collection.insert_one(user_dict)
        return JSONResponse(content={"response": "Successfully created a new account."})

    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exist",
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post("/auth/login")
async def login(user: LoginData) -> JSONResponse:
    try:
        auth_user = await authenticate_user(
            user.email, str((user.password).get_secret_value())
        )

        if not auth_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )

        # if not authenticated_user.get("is_verified", False):
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail="User account is not verified. Please verify your email.",
        #     )

        # expiration = timedelta(minutes=int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES')))
        expiration = timedelta(days=30)
        access_token = encode_jwt(
            data={"sub": str(auth_user["_id"])}, expires_delta=expiration
        )

        auth_user["created_at"] = str(auth_user["created_at"])
        auth_user["id"] = str(auth_user["_id"])
        del auth_user["_id"]

        json_user_data = json_util.dumps(auth_user)

        response = JSONResponse(content=json.loads(json_user_data))

        response.set_cookie(
            key="access_token",
            value=access_token,
            samesite="none",
            secure=True,
            httponly=True,
            expires=datetime.now(timezone.utc) + timedelta(days=60),
        )
        return response

    except HTTPException as httpexc:
        raise httpexc

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/auth/me")
async def get_user_data(user_id: str = Depends(get_current_user)):
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authenticated"
        )

    user = await users_collection.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    response_data = {
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        **(
            {"profile_picture": user["profile_picture"]}
            if user.get("profile_picture")
            else {}
        ),
    }

    return JSONResponse(content=response_data)


@router.post("/auth/logout")
async def logout(response: Response):
    response.set_cookie(
        key="access_token",
        value=None,
        samesite="none",
        secure=True,
        httponly=True,
        expires=datetime.now(timezone.utc),
    )
    return {"message": "User logged out successfully."}


# @router.get("/getUserInfo")
# def is_token_valid(current_user: bool = Depends(is_user_valid)):
#     return {"response": "Token is valid", "user": current_user}


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
