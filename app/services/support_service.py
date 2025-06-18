"""Support service for handling support requests and email notifications."""

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

import resend
from fastapi import HTTPException

from app.config.loggers import app_logger as logger
from app.config.settings import settings
from app.db.collections import support_collection
from app.models.support_models import (
    SupportEmailNotification,
    SupportRequestCreate,
    SupportRequestResponse,
    SupportRequestStatus,
    SupportRequestSubmissionResponse,
    SupportRequestType,
    SupportRequestPriority,
)

# Initialize Resend with API key
resend.api_key = settings.RESEND_API_KEY

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


async def _send_support_email_notifications(
    notification_data: SupportEmailNotification,
) -> None:
    """
    Send email notifications to support team and user confirmation.

    Args:
        notification_data: Email notification data
    """
    try:
        # Email to support team
        support_subject = f"[{notification_data.ticket_id}] New {notification_data.type.value.title()} Request: {notification_data.title}"
        support_html = _generate_support_team_email_html(notification_data)

        # Send to support team
        for support_email in notification_data.support_emails:
            try:
                resend.Emails.send(
                    {
                        "from": "GAIA Support <noreply@heygaia.io>",
                        "to": [support_email],
                        "subject": support_subject,
                        "html": support_html,
                        "reply_to": notification_data.user_email,
                    }
                )
                logger.info(f"Support notification sent to {support_email}")
            except Exception as e:
                logger.error(
                    f"Failed to send support email to {support_email}: {str(e)}"
                )

        # User confirmation email
        user_subject = f"[{notification_data.ticket_id}] Your {notification_data.type.value} request has been received"
        user_html = _generate_user_confirmation_email_html(notification_data)

        try:
            resend.Emails.send(
                {
                    "from": "GAIA Support <noreply@heygaia.io>",
                    "to": [notification_data.user_email],
                    "subject": user_subject,
                    "html": user_html,
                }
            )
            logger.info(
                f"Confirmation email sent to user {notification_data.user_email}"
            )
        except Exception as e:
            logger.error(f"Failed to send confirmation email to user: {str(e)}")

    except Exception as e:
        logger.error(f"Error sending email notifications: {str(e)}")
        # Don't raise exception here as the support request was already created


def _generate_support_team_email_html(data: SupportEmailNotification) -> str:
    """Generate clean, professional HTML email for support team."""
    logo_url = "https://api.heygaia.io/static/logo.png"
    theme_color = "#00bbff"
    request_type_color = theme_color
    request_type_label = (
        "Support Request"
        if data.type == SupportRequestType.SUPPORT
        else "Feature Request"
    )

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{request_type_label}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9f9fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f1f1f;">
        <div style="max-width: 600px; margin: 0 auto; padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 32px;">
                <img src="{logo_url}" alt="GAIA Logo" style="height: 36px;" />
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <h1 style="margin: 0 0 12px 0; font-size: 20px; color: {theme_color};">{request_type_label}</h1>
                <p style="margin: 0 0 24px 0; font-size: 13px; color: #6b7280;">Ticket ID: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">{data.ticket_id}</code></p>

                <h2 style="margin: 0 0 16px 0; font-size: 17px; color: #111827;">{data.title}</h2>

                <div style="margin-top: 12px;">
                    <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 500;">Description</p>
                    <div style="background-color: #f9fafb; padding: 14px 16px; border-left: 4px solid {request_type_color}; border-radius: 8px; font-size: 15px; line-height: 1.6;">
                        {data.description.replace(chr(10), "<br>")}
                    </div>
                </div>

                <div style="margin-top: 28px;">
                    <p style="font-weight: 500; font-size: 14px; margin-bottom: 8px;">Submitted By</p>
                    <p style="margin: 4px 0;"><strong>Name:</strong> {data.user_name}</p>
                    <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:{data.user_email}" style="color: {theme_color}; text-decoration: none;">{data.user_email}</a></p>
                    <p style="margin: 4px 0;"><strong>User ID:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">{data.user_email}</code></p>
                    <p style="margin: 4px 0;"><strong>Submitted:</strong> {data.created_at.strftime("%B %d, %Y at %I:%M %p UTC")}</p>
                </div>

                <div style="text-align: center; margin-top: 36px;">
                    <a href="mailto:{data.user_email}?subject=Re: [{data.ticket_id}] {data.title}" 
                       style="background: {theme_color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                        Reply to User
                    </a>
                </div>
            </div>

            <p style="text-align: center; margin-top: 32px; font-size: 13px; color: #9ca3af;">
                This is an automated message from GAIA Support
            </p>
        </div>
    </body>
    </html>
    """


def _generate_user_confirmation_email_html(data: SupportEmailNotification) -> str:
    """Generate HTML email content for user confirmation."""
    request_type_color = (
        "#2563eb" if data.type == SupportRequestType.SUPPORT else "#7c3aed"
    )
    request_type_label = (
        "Support Request"
        if data.type == SupportRequestType.SUPPORT
        else "Feature Request"
    )

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your {request_type_label} Received</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Thank You!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your {request_type_label.lower()} has been received</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Hi {data.user_name}!</h2>
            <p style="margin-bottom: 20px;">We've received your {request_type_label.lower()} and wanted to let you know that we're on it. Our team will review your submission and get back to you as soon as possible.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid {request_type_color};">
                <h3 style="margin-top: 0; color: #2c3e50; display: flex; align-items: center;">
                    <span style="background: {request_type_color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-right: 15px;">{request_type_label.upper()}</span>
                    {data.title}
                </h3>
                <p style="margin: 15px 0 5px 0;"><strong>Ticket ID:</strong> <code style="background: #f1f3f4; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-weight: bold;">{data.ticket_id}</code></p>
                <p style="margin: 5px 0;"><strong>Submitted:</strong> {data.created_at.strftime("%B %d, %Y at %I:%M %p UTC")}</p>
            </div>
        </div>
        
        <div style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #1976d2; margin-top: 0;">What happens next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
                <li style="margin-bottom: 8px;">Our support team will review your {request_type_label.lower()}</li>
                <li style="margin-bottom: 8px;">You'll receive updates via email as we progress</li>
                <li style="margin-bottom: 8px;">We aim to respond within 24-48 hours</li>
                <li>For urgent issues, please include "URGENT" in your follow-up emails</li>
            </ul>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; text-align: center;">
            <h3 style="color: #856404; margin-top: 0;">Need to add more information?</h3>
            <p style="margin: 10px 0; color: #6c5502;">Simply reply to this email with your ticket ID <strong>{data.ticket_id}</strong> and we'll add it to your request.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e8ed; color: #666; font-size: 14px;">
            <p>Thank you for using GAIA!</p>
            <p>Best regards,<br>The GAIA Support Team</p>
        </div>
    </body>
    </html>
    """


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
