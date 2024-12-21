from fastapi import HTTPException, Request, status
from app.utils.util_auth import decode_jwt


async def get_current_user(request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token:
        return None

    try:
        payload = decode_jwt(access_token)
        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
            )

        return user_id

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token"
        )
