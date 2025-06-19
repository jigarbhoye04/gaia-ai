"""Email utilities for sending various types of emails."""

import os
import resend
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.config.loggers import app_logger as logger
from app.config.settings import settings
from app.models.support_models import SupportEmailNotification, SupportRequestType

# Initialize Resend with API key
resend.api_key = settings.RESEND_API_KEY

# Get the directory where templates are stored
TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")

# Initialize Jinja2 environment
jinja_env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(["html", "xml"]),
)


async def send_support_team_notification(
    notification_data: SupportEmailNotification,
) -> None:
    """Send email notification to support team."""
    try:
        subject = f"[{notification_data.ticket_id}] New {notification_data.type.value.title()} Request: {notification_data.title}"
        html_content = generate_support_team_email_html(notification_data)

        for support_email in notification_data.support_emails:
            try:
                resend.Emails.send(
                    {
                        "from": "GAIA Support <support@heygaia.io>",
                        "to": [support_email],
                        "subject": subject,
                        "html": html_content,
                        "reply_to": notification_data.user_email,
                    }
                )
                logger.info(f"Support notification sent to {support_email}")
            except Exception as e:
                logger.error(
                    f"Failed to send support email to {support_email}: {str(e)}"
                )
    except Exception as e:
        logger.error(f"Error sending support team notifications: {str(e)}")
        raise


async def send_user_confirmation_email(
    notification_data: SupportEmailNotification,
) -> None:
    """Send confirmation email to user that support request has been created."""
    try:
        subject = f"[{notification_data.ticket_id}] Your {notification_data.type.value} request has been received"
        html_content = generate_user_confirmation_email_html(notification_data)

        resend.Emails.send(
            {
                "from": "GAIA support <support@heygaia.io>",
                "to": [notification_data.user_email],
                "subject": subject,
                "html": html_content,
            }
        )
        logger.info(f"Confirmation email sent to user {notification_data.user_email}")
    except Exception as e:
        logger.error(f"Failed to send confirmation email to user: {str(e)}")
        raise


def generate_support_team_email_html(data: SupportEmailNotification) -> str:
    """Generate HTML email for support team using Jinja2 template."""
    try:
        template = jinja_env.get_template("support_to_admin.html")

        request_type_label = (
            "Support Request"
            if data.type == SupportRequestType.SUPPORT
            else "Feature Request"
        )

        # Render template with data
        html_content = template.render(
            request_type_label=request_type_label,
            ticket_id=data.ticket_id,
            title=data.title,
            description=data.description,
            user_name=data.user_name,
            user_email=data.user_email,
        )

        return html_content
    except Exception as e:
        logger.error(f"Error generating support team email HTML: {str(e)}")
        raise


def generate_user_confirmation_email_html(data: SupportEmailNotification) -> str:
    """Generate HTML email content for user confirmation using Jinja2 template."""
    try:
        template = jinja_env.get_template("user_confirmation.html")

        request_type_color = (
            "#2563eb" if data.type == SupportRequestType.SUPPORT else "#7c3aed"
        )
        request_type_label = (
            "Support Request"
            if data.type == SupportRequestType.SUPPORT
            else "Feature Request"
        )

        # Render template with data
        html_content = template.render(
            request_type_label=request_type_label,
            request_type_label_lower=request_type_label.lower(),
            request_type_label_upper=request_type_label.upper(),
            request_type_color=request_type_color,
            user_name=data.user_name,
            title=data.title,
            ticket_id=data.ticket_id,
            created_at=data.created_at.strftime("%B %d, %Y at %I:%M %p UTC"),
        )

        return html_content
    except Exception as e:
        logger.error(f"Error generating user confirmation email HTML: {str(e)}")
        raise
