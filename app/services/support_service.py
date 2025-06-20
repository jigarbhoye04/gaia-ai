"""Support service for handling support requests and email notifications."""

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import HTTPException, UploadFile

from app.config.loggers import app_logger as logger
from app.db.collections import support_collection
from app.models.support_models import (
    SupportAttachment,
    SupportEmailNotification,
    SupportRequestCreate,
    SupportRequestResponse,
    SupportRequestStatus,
    SupportRequestSubmissionResponse,
    SupportRequestType,
    SupportRequestPriority,
)
from app.services.upload_service import upload_file_to_cloudinary
from app.utils.email_utils import (
    send_support_team_notification,
    send_support_to_user_email,
)

# Support team emails
SUPPORT_EMAILS = [
    "support@heygaia.io",
    "aryan@heygaia.io",
]


async def create_support_request(
    request_data: SupportRequestCreate,
    user_id: str,
    user_email: str,
    user_name: Optional[str] = None,
) -> SupportRequestSubmissionResponse:
    """
    Create a new support request and send email notifications.

    Args:
        request_data: Support request data
        user_id: ID of the user creating the request
        user_email: Email of the user
        user_name: Name of the user (optional)

    Returns:
        SupportRequestSubmissionResponse with success status and ticket ID
    """
    try:
        # Generate unique IDs
        request_id = str(uuid.uuid4())
        ticket_id = (
            f"GAIA-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        )

        current_time = datetime.now(timezone.utc)

        # Create support request document
        support_request_doc = {
            "_id": request_id,
            "ticket_id": ticket_id,
            "user_id": user_id,
            "user_email": user_email,
            "user_name": user_name,
            "type": request_data.type.value,
            "title": request_data.title,
            "description": request_data.description,
            "status": SupportRequestStatus.OPEN.value,
            "priority": SupportRequestPriority.MEDIUM.value,  # Default priority
            "created_at": current_time,
            "updated_at": current_time,
            "resolved_at": None,
            "tags": [],
            "metadata": {
                "source": "web_form",
                "user_agent": None,  # Could be added from request headers
            },
        }

        # Store in database
        result = await support_collection.insert_one(support_request_doc)

        if not result.inserted_id:
            raise HTTPException(
                status_code=500, detail="Failed to create support request"
            )

        # Send email notifications
        await _send_support_email_notifications(
            SupportEmailNotification(
                user_name=user_name or "User",
                user_email=user_email,
                ticket_id=ticket_id,
                type=request_data.type,
                title=request_data.title,
                description=request_data.description,
                created_at=current_time,
                support_emails=SUPPORT_EMAILS,
            )
        )

        # Create response object
        support_request_response = SupportRequestResponse(
            id=request_id,
            ticket_id=ticket_id,
            user_id=user_id,
            user_email=user_email,
            user_name=user_name,
            type=request_data.type,
            title=request_data.title,
            description=request_data.description,
            status=SupportRequestStatus.OPEN,
            priority=SupportRequestPriority.MEDIUM,
            created_at=current_time,
            updated_at=current_time,
            resolved_at=None,
            tags=[],
            metadata=support_request_doc["metadata"],
        )

        logger.info(
            f"Support request created successfully: {ticket_id} for user {user_id}"
        )

        return SupportRequestSubmissionResponse(
            success=True,
            message="Support request submitted successfully. You will receive an email confirmation shortly.",
            ticket_id=ticket_id,
            support_request=support_request_response,
        )

    except Exception as e:
        logger.error(f"Error creating support request: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create support request: {str(e)}"
        )


async def create_support_request_with_attachments(
    request_data: SupportRequestCreate,
    attachments: List[UploadFile],
    user_id: str,
    user_email: str,
    user_name: Optional[str] = None,
) -> SupportRequestSubmissionResponse:
    """
    Create a new support request with file attachments and send email notifications.

    Args:
        request_data: Support request data
        attachments: List of uploaded files
        user_id: ID of the user creating the request
        user_email: Email of the user
        user_name: Name of the user (optional)

    Returns:
        SupportRequestSubmissionResponse with success status and ticket ID
    """
    try:
        # Generate unique IDs
        request_id = str(uuid.uuid4())
        ticket_id = (
            f"GAIA-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        )

        current_time = datetime.now(timezone.utc)

        # Process attachments
        processed_attachments = []
        attachment_urls = []

        if attachments:
            # Validate file constraints
            ALLOWED_TYPES = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
            ]
            MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
            MAX_ATTACHMENTS = 5

            if len(attachments) > MAX_ATTACHMENTS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Maximum {MAX_ATTACHMENTS} images allowed",
                )

            for attachment in attachments:
                # Validate file type
                if attachment.content_type not in ALLOWED_TYPES:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Only image files are supported. File type {attachment.content_type} not allowed. Please use JPG, PNG, or WebP.",
                    )

                # Validate file size
                content = await attachment.read()
                if len(content) > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=400,
                        detail=f"File {attachment.filename} exceeds maximum size of 10MB",
                    )

                # Upload to Cloudinary
                if not attachment.filename:
                    raise HTTPException(
                        status_code=400, detail="All images must have filenames"
                    )

                public_id = f"support/{ticket_id}_{attachment.filename}"
                try:
                    file_url = upload_file_to_cloudinary(
                        public_id=public_id, file_data=content
                    )
                    attachment_urls.append(file_url)

                    # Create attachment metadata
                    attachment_info = SupportAttachment(
                        filename=attachment.filename,
                        file_size=len(content),
                        content_type=attachment.content_type
                        or "application/octet-stream",
                        file_url=file_url,
                        uploaded_at=current_time,
                    )
                    processed_attachments.append(attachment_info.dict())

                except Exception as e:
                    logger.error(
                        f"Failed to upload image {attachment.filename}: {str(e)}"
                    )
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to upload image {attachment.filename}",
                    )

        # Create support request document
        support_request_doc = {
            "_id": request_id,
            "ticket_id": ticket_id,
            "user_id": user_id,
            "user_email": user_email,
            "user_name": user_name,
            "type": request_data.type.value,
            "title": request_data.title,
            "description": request_data.description,
            "status": SupportRequestStatus.OPEN.value,
            "priority": SupportRequestPriority.MEDIUM.value,
            "created_at": current_time,
            "updated_at": current_time,
            "resolved_at": None,
            "tags": [],
            "attachments": processed_attachments,
            "metadata": {
                "source": "web_form_with_images",
                "user_agent": None,
                "image_count": len(processed_attachments),
            },
        }

        # Store in database
        result = await support_collection.insert_one(support_request_doc)

        if not result.inserted_id:
            raise HTTPException(
                status_code=500, detail="Failed to create support request"
            )

        # Send email notifications with attachments
        notification_data = SupportEmailNotification(
            user_name=user_name or "User",
            user_email=user_email,
            ticket_id=ticket_id,
            type=request_data.type,
            title=request_data.title,
            description=request_data.description,
            created_at=current_time,
            support_emails=SUPPORT_EMAILS,
        )

        await _send_support_email_notifications(notification_data)

        # Create response object
        support_request_response = SupportRequestResponse(
            id=request_id,
            ticket_id=ticket_id,
            user_id=user_id,
            user_email=user_email,
            user_name=user_name,
            type=request_data.type,
            title=request_data.title,
            description=request_data.description,
            status=SupportRequestStatus.OPEN,
            priority=SupportRequestPriority.MEDIUM,
            created_at=current_time,
            updated_at=current_time,
            resolved_at=None,
            tags=[],
            attachments=[SupportAttachment(**att) for att in processed_attachments],
            metadata=support_request_doc["metadata"],
        )

        logger.info(
            f"Support request with {len(processed_attachments)} images created successfully: {ticket_id} for user {user_id}"
        )

        return SupportRequestSubmissionResponse(
            success=True,
            message="Support request with images submitted successfully. You will receive an email confirmation shortly.",
            ticket_id=ticket_id,
            support_request=support_request_response,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating support request with images: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create support request: {str(e)}"
        )


async def _send_support_email_notifications(
    notification_data: SupportEmailNotification,
) -> None:
    """
    Send email notifications to support team and support to user.

    Args:
        notification_data: Email notification data
    """
    try:
        # Send to support team
        await send_support_team_notification(notification_data)

        # Send support to user email
        await send_support_to_user_email(notification_data)

    except Exception as e:
        logger.error(f"Error sending email notifications: {str(e)}")
        # Don't raise exception here as the support request was already created in db


async def get_user_support_requests(
    user_id: str,
    page: int = 1,
    per_page: int = 10,
    status_filter: Optional[SupportRequestStatus] = None,
) -> Dict:
    """
    Get support requests for a specific user.

    Args:
        user_id: ID of the user
        page: Page number for pagination
        per_page: Number of items per page
        status_filter: Optional status filter

    Returns:
        Dictionary with support requests and pagination info
    """
    try:
        query = {"user_id": user_id}
        if status_filter:
            query["status"] = status_filter.value

        # Count total documents
        total = await support_collection.count_documents(query)

        # Calculate pagination
        skip = (page - 1) * per_page

        # Fetch documents
        cursor = (
            support_collection.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(per_page)
        )
        requests = await cursor.to_list(length=per_page)

        # Convert to response models
        support_requests = []
        for req in requests:
            req["id"] = str(req["_id"])
            del req["_id"]
            support_requests.append(SupportRequestResponse(**req))

        return {
            "requests": support_requests,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page,
            },
        }

    except Exception as e:
        logger.error(f"Error fetching user support requests: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch support requests")


async def get_all_support_requests(
    page: int = 1,
    per_page: int = 20,
    status_filter: Optional[SupportRequestStatus] = None,
    type_filter: Optional[SupportRequestType] = None,
) -> Dict:
    """
    Get all support requests (for admin use).

    Args:
        page: Page number for pagination
        per_page: Number of items per page
        status_filter: Optional status filter
        type_filter: Optional type filter

    Returns:
        Dictionary with support requests and pagination info
    """
    try:
        query = {}
        if status_filter:
            query["status"] = status_filter.value
        if type_filter:
            query["type"] = type_filter.value

        # Count total documents
        total = await support_collection.count_documents(query)

        # Calculate pagination
        skip = (page - 1) * per_page

        # Fetch documents
        cursor = (
            support_collection.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(per_page)
        )
        requests = await cursor.to_list(length=per_page)

        # Convert to response models
        support_requests = []
        for req in requests:
            req["id"] = str(req["_id"])
            del req["_id"]
            support_requests.append(SupportRequestResponse(**req))

        return {
            "requests": support_requests,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page,
            },
        }

    except Exception as e:
        logger.error(f"Error fetching all support requests: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch support requests")
