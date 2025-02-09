from fastapi import APIRouter


router = APIRouter()


@router.get("/ping", tags=["Health"])
@router.get("/", tags=["Health"])
async def ping():
    return {"message": "Welcome to the GAIA API!"}
