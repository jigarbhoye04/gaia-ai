from fastapi import APIRouter, HTTPException, status,Depends, Form, Request
from fastapi.responses import JSONResponse
from pydantic import EmailStr, SecretStr
from dotenv import load_dotenv
from bson import json_util
from pymongo.errors import DuplicateKeyError
import json
from datetime import datetime, timedelta, timezone
from api.validators.auth import SignupData
from api.functionality.authentication import get_password_hash, authenticate_user, decode_jwt
from api.database.connect import users_collection
from api.functionality.jwt import create_access_token, decode_jwt

load_dotenv()
router = APIRouter()

@router.post("/signup")
async def signup(user_dict: SignupData = Depends(SignupData.get_signup_data)):
    try:
        user_dict["hashed_password"] = get_password_hash(user_dict["password"].get_secret_value())
        del user_dict["password"]
        await users_collection.insert_one(user_dict)
        return JSONResponse(content={"response":"Successfully created a new account."})
    
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with this email already exist")
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/login")
async def login( 
    email: EmailStr = Form(...),
    password: SecretStr = Form(...)
) -> JSONResponse:
    
    try:
        user = await authenticate_user(email, str(password.get_secret_value()))
    
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

        # expiration = timedelta(minutes=int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES')))
        expiration = timedelta(days=30)
        access_token = create_access_token(data={"sub": str(user["_id"])}, expires_delta=expiration)

        response = JSONResponse(content=json.loads(json_util.dumps(user)))
        response.set_cookie(
            key="access_token",
            value=access_token,
            samesite="none",  #! MAKE SURE TO EDIT THIS
            secure=True,  #! MAKE SURE TO EDIT THIS
            httponly=True, 
            expires=datetime.now(timezone.utc) + timedelta(days=60)
        )
        return response
        
    except HTTPException as httpexc:
        raise httpexc
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/isTokenValid") #! Temporary!
def isTokenValid(request: Request):

    access_token = request.cookies.get("access_token")
    print(access_token)
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access / refresh token")
        
    jwt_payload = decode_jwt(access_token)
        
    if not jwt_payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")

    token_expiration = datetime.fromtimestamp(jwt_payload["exp"], timezone.utc)

    if token_expiration < datetime.now(timezone.utc): 
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is not valid")

    return JSONResponse(content={"message": "Access token still valid."})
