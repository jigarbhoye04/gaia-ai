"""Support API router for handling support requests."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.models.support_models import (
    SupportRequestCreate,
    SupportRequestStatus,
    SupportRequestSubmissionResponse,
)
from app.services.support_service import (
    create_support_request,
    get_user_support_requests,
)

router = APIRouter()


@router.post(
    "/support/requests",
    response_model=SupportRequestSubmissionResponse,
    summary="Submit a support or feature request",
    description="Create a new support request or feature request. Sends email notifications to support team and user confirmation.",
)
async def submit_support_request(
    request_data: SupportRequestCreate,
    current_user: dict = Depends(get_current_user),
) -> SupportRequestSubmissionResponse:
    """
    Submit a new support or feature request.

    This endpoint:
    - Creates a support request in the database
    - Generates a unique ticket ID
    - Sends email notification to support team
    - Sends confirmation email to the user

    Args:
        request_data: Support request details
        current_user: Current authenticated user

    Returns:
        SupportRequestSubmissionResponse with success status and ticket ID
    """
    try:
        user_id = current_user.get("user_id")
        user_email = current_user.get("email")
        user_name = current_user.get("name")

        if not user_id or not user_email:
            raise HTTPException(status_code=401, detail="User authentication required")

        return await create_support_request(
            request_data=request_data,
            user_id=user_id,
            user_email=user_email,
            user_name=user_name,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to submit support request: {str(e)}"
        )


@router.get(
    "/support/requests/my",
    summary="Get user's support requests",
    description="Retrieve all support requests created by the current user with pagination.",
)
async def get_my_support_requests(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=50, description="Items per page"),
    status: Optional[SupportRequestStatus] = Query(
        None, description="Filter by status"
    ),
    current_user: dict = Depends(get_current_user),
):
    """
    Get support requests for the current user.

    Args:
        page: Page number for pagination
        per_page: Number of items per page (max 50)
        status: Optional status filter
        current_user: Current authenticated user

    Returns:
        Dictionary with user's support requests and pagination info
    """
    try:
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User authentication required")

        return await get_user_support_requests(
            user_id=user_id, page=page, per_page=per_page, status_filter=status
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch support requests: {str(e)}"
        )


# @router.get(
#     "/support/requests/admin",
#     summary="Get all support requests (Admin only)",
#     description="Retrieve all support requests in the system. This endpoint is for administrative use.",
# )
# async def get_all_support_requests_admin(
#     page: int = Query(1, ge=1, description="Page number"),
#     per_page: int = Query(20, ge=1, le=100, description="Items per page"),
#     status: Optional[SupportRequestStatus] = Query(
#         None, description="Filter by status"
#     ),
#     type: Optional[SupportRequestType] = Query(None, description="Filter by type"),
#     current_user: dict = Depends(get_current_user),
# ):
#     """
#     Get all support requests (admin endpoint).

#     This endpoint requires admin privileges. It returns all support requests
#     in the system with optional filtering by status and type.

#     Args:
#         page: Page number for pagination
#         per_page: Number of items per page (max 100)
#         status: Optional status filter
#         type: Optional type filter
#         current_user: Current authenticated user

#     Returns:
#         Dictionary with all support requests and pagination info
#     """
#     try:
#         # Note: In a real application, you would check for admin privileges here
#         # For now, we'll allow any authenticated user to access this endpoint
#         # You should implement proper role-based access control

#         user_id = current_user.get("user_id")
#         if not user_id:
#             raise HTTPException(status_code=401, detail="User authentication required")

#         # TODO: Add admin role check
#         # if not current_user.get("is_admin"):
#         #     raise HTTPException(status_code=403, detail="Admin privileges required")

#         return await get_all_support_requests(
#             page=page, per_page=per_page, status_filter=status, type_filter=type
#         )

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500, detail=f"Failed to fetch support requests: {str(e)}"
#         )
