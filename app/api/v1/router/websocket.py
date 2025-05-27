from typing import Any, Dict

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.utils.common_utils import (
    websocket_manager as connection_manager,
)

router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("/connect")
async def websocket_endpoint(
    websocket: WebSocket, user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Endpoint to establish WebSocket connection for authenticated users.
    Each user can have multiple connections (e.g., from different devices).
    """
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = user.get("user_id")

    if not user_id or not isinstance(user_id, str):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    connection_manager.add_connection(user_id=user_id, websocket=websocket)

    # Remove the connection when the WebSocket is closed
    try:
        await websocket.accept()
        while True:
            # Keep the connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        # Handle disconnection
        connection_manager.remove_connection(user_id=user_id, websocket=websocket)
        await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)
    except Exception as e:
        # Handle any other exceptions
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        connection_manager.remove_connection(user_id=user_id, websocket=websocket)
        raise e
