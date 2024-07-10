from fastapi import APIRouter
from fastapi.responses import JSONResponse
from api.validators.auth import SignupData
from api.functionality.authentication import get_password_hash, check_user_exists
from api.database.connect import client
router = APIRouter()

@router.post("/signup")
async def signup(user: SignupData):
    """Endpoint to register a new user."""

    try:
        db = client.get_database("auth")
        users_collection = db.get_collection("users")
        user_dict = user.dict()
        user_dict["hashed_password"] = get_password_hash(user_dict["password"].get_secret_value())
        del user_dict["password"]

        if(await check_user_exists(user_dict["email"])):
            return JSONResponse(content={"response":"User with this email already exists."})
        else:
            users_collection.insert_one(user_dict)
            return JSONResponse(content={"response":"Successfully created a new account."})
    
    except Exception as e:
        return JSONResponse(content={"error":f"Could not create an account: {str(e)}"})
        

        
