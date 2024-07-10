from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from api.validators.auth import SignupData, LoginData
from api.functionality.authentication import get_password_hash, check_user_exists
from api.database.connect import users_collection
from pymongo.errors import DuplicateKeyError

router = APIRouter()

@router.post("/signup")
async def signup(user: SignupData):
    """Endpoint to register a new user."""
    try:
        user_dict = user.dict()
        user_dict["hashed_password"] = get_password_hash(user.password.get_secret_value())
        del user_dict["password"]

        await users_collection.insert_one(user_dict)
        return JSONResponse(content={"response":"Successfully created a new account."})
    
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with this email already exist")
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/login")
async def signup(user: LoginData):
    """Endpoint for a user to login."""
    user_dict = user.dict()
    try:

        if(not await check_user_exists(user_dict["email"])):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")

        #TODO: Implement logging in logic

        return JSONResponse(content={"response":"Successfully logged in."})
    
    except HTTPException as httpexc:
        raise httpexc
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
