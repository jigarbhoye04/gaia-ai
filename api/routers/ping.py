from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def main():
    print("Pinged server successfully!")
    return True
