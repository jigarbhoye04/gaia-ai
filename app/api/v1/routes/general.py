from fastapi import APIRouter

router = APIRouter()


async def helper_function():
    return {"message": "Welcome to the GAIA API!"}


@router.get("/ping")
async def ping():
    return helper_function
