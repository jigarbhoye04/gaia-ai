import json
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.models.mail_models import (
    EmailRequest,
    EmailSummaryRequest,
    SendEmailRequest,
    EmailReadStatusRequest,
    EmailActionRequest,
)
from app.prompts.user.mail_prompts import EMAIL_COMPOSER, EMAIL_SUMMARIZER
from app.utils.llm_utils import do_prompt_no_stream
from app.services.mail_service import (
    fetch_detailed_messages,
    fetch_thread,
    get_gmail_service,
    send_email,
    mark_messages_as_read,
    mark_messages_as_unread,
    star_messages,
    unstar_messages,
    trash_messages,
    untrash_messages,
    archive_messages,
    move_to_inbox,
)
from app.utils.embedding_utils import search_notes_by_similarity
from app.utils.general_utils import transform_gmail_message

router = APIRouter()


@router.get("/gmail/labels", summary="List Gmail Labels")
def list_labels(current_user: dict = Depends(get_current_user)):
    try:
        service = get_gmail_service(current_user)
        results = service.users().labels().list(userId="me").execute()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/gmail/messages")
def list_messages(
    max_results: int = 20,
    pageToken: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    try:
        service = get_gmail_service(current_user)

        # Prepare params for message list
        params = {"userId": "me", "labelIds": ["INBOX"], "maxResults": max_results}
        if pageToken:
            params["pageToken"] = pageToken

        # Fetch message list
        results = service.users().messages().list(**params).execute()
        messages = results.get("messages", [])

        # Use batching to fetch full details for each message
        detailed_messages = fetch_detailed_messages(service, messages)

        return {
            "messages": [transform_gmail_message(msg) for msg in detailed_messages],
            "nextPageToken": results.get("nextPageToken"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mail/ai/compose")
async def process_email(
    request: EmailRequest,
    current_user: dict = Depends(get_current_user),
) -> Any:
    try:
        user_id = current_user.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="User ID is required")

        notes = await search_notes_by_similarity(
            input_text=request.prompt, user_id=str(user_id)
        )

        prompt = EMAIL_COMPOSER.format(
            sender_name=current_user.get("name") or "none",
            subject=request.subject or "empty",
            body=request.body or "empty",
            writing_style=request.writingStyle or "Professional",
            content_length=request.contentLength or "None",
            clarity_option=request.clarityOption or "None",
            notes="- ".join(notes) if notes else "No relevant notes found.",
            prompt=request.prompt,
        )

        result = await do_prompt_no_stream(
            prompt=prompt, model="@cf/meta/llama-3.3-70b-instruct-fp8-fast"
        )
        print(result)
        if isinstance(result, dict) and result.get("response"):
            try:
                parsed_result = json.loads(result["response"])
                subject = parsed_result.get("subject", "")
                body = parsed_result.get("body", "")

                return {"subject": subject, "body": body}
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Failed to parse response {e}"
                )
        else:
            raise HTTPException(status_code=500, detail="Invalid response format")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/gmail/send", summary="Send an email using Gmail API")
async def send_email_route(
    to: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    cc: Optional[str] = Form(None),
    bcc: Optional[str] = Form(None),
    attachments: Optional[List[UploadFile]] = File(None),
    current_user: dict = Depends(get_current_user),
):
    """
    Send an email using the Gmail API.

    - **to**: Recipient email addresses (comma-separated)
    - **subject**: Email subject
    - **body**: Email body
    - **cc**: Optional CC recipients (comma-separated)
    - **bcc**: Optional BCC recipients (comma-separated)
    - **attachments**: Optional files to attach to the email
    """
    try:
        service = get_gmail_service(current_user)

        # Get the user's email address
        profile = service.users().getProfile(userId="me").execute()
        sender = profile.get("emailAddress")

        # Parse recipients
        to_list = [email.strip() for email in to.split(",") if email.strip()]
        cc_list = [email.strip() for email in cc.split(",")] if cc else None
        bcc_list = [email.strip() for email in bcc.split(",")] if bcc else None

        # Send the email
        sent_message = send_email(
            service=service,
            sender=sender,
            to_list=to_list,
            subject=subject,
            body=body,
            is_html=True,
            cc_list=cc_list,
            bcc_list=bcc_list,
            attachments=attachments,
        )

        return {
            "message_id": sent_message.get("id"),
            "status": "Email sent successfully",
            "attachments_count": len(attachments) if attachments else 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


@router.post("/gmail/send-json", summary="Send an email using JSON payload")
async def send_email_json(
    request: SendEmailRequest, current_user: dict = Depends(get_current_user)
):
    """
    Send an email using the Gmail API with JSON payload (no attachments).

    - **to**: List of recipient email addresses
    - **subject**: Email subject
    - **body**: Email body
    - **cc**: Optional list of CC recipients
    - **bcc**: Optional list of BCC recipients
    """
    try:
        service = get_gmail_service(current_user)

        # Get the user's email address
        profile = service.users().getProfile(userId="me").execute()
        sender = profile.get("emailAddress")

        # Send the email
        sent_message = send_email(
            service=service,
            sender=sender,
            to_list=request.to,
            subject=request.subject,
            body=request.body,
            is_html=False,
            cc_list=request.cc,
            bcc_list=request.bcc,
            attachments=None,
        )

        return {
            "message_id": sent_message.get("id"),
            "status": "Email sent successfully",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


@router.post("/gmail/summarize", summary="Summarize an email using LLM")
async def summarize_email(
    request: EmailSummaryRequest,
    current_user: dict = Depends(get_current_user),
) -> Any:
    """
    Summarize an email using the LLM service.

    - **message_id**: The Gmail message ID to summarize
    - **include_key_points**: Whether to include key points in the summary
    - **include_action_items**: Whether to include action items in the summary
    - **max_length**: Maximum length of the summary in words

    Returns a summary of the email with optional key points and action items.
    """
    try:
        service = get_gmail_service(current_user)

        # Fetch the email by ID
        message = (
            service.users()
            .messages()
            .get(userId="me", id=request.message_id, format="full")
            .execute()
        )

        # Transform the message into a readable format
        email_data = transform_gmail_message(message)

        action_items_instruction = (
            "Identify any action items or requests made in the email."
            if request.include_action_items
            else ""
        )

        prompt = EMAIL_SUMMARIZER.format(
            subject=email_data.get("subject", "No Subject"),
            sender=email_data.get("from", "Unknown"),
            date=email_data.get("time", "Unknown"),
            content=email_data.get(
                "body", email_data.get("snippet", "No content available")
            ),
            max_length=request.max_length or 150,
            action_items_instruction=action_items_instruction,
        )

        # Call the LLM service to generate the summary
        llm_response = await do_prompt_no_stream(prompt)

        return {
            "email_id": request.message_id,
            "email_subject": email_data.get("subject", "No Subject"),
            "result": llm_response,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to summarize email: {str(e)}"
        )


@router.post("/gmail/mark-as-read", summary="Mark emails as read")
async def mark_as_read(
    request: EmailReadStatusRequest, current_user: dict = Depends(get_current_user)
):
    """
    Mark Gmail messages as read by removing the UNREAD label.

    - **message_ids**: List of Gmail message IDs to mark as read

    Returns a list of IDs that were successfully marked as read.
    """
    try:
        service = get_gmail_service(current_user)
        modified_messages = mark_messages_as_read(service, request.message_ids)

        return {
            "success": True,
            "marked_as_read": [msg["id"] for msg in modified_messages],
            "count": len(modified_messages),
            "status": "Messages marked as read",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to mark messages as read: {str(e)}"
        )


@router.post("/gmail/mark-as-unread", summary="Mark emails as unread")
async def mark_as_unread(
    request: EmailReadStatusRequest, current_user: dict = Depends(get_current_user)
):
    """
    Mark Gmail messages as unread by adding the UNREAD label.

    - **message_ids**: List of Gmail message IDs to mark as unread

    Returns a list of IDs that were successfully marked as unread.
    """
    try:
        service = get_gmail_service(current_user)
        modified_messages = mark_messages_as_unread(service, request.message_ids)

        return {
            "success": True,
            "marked_as_unread": [msg["id"] for msg in modified_messages],
            "count": len(modified_messages),
            "status": "Messages marked as unread",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to mark messages as unread: {str(e)}"
        )


@router.post("/gmail/star", summary="Star emails")
async def star_emails(
    request: EmailActionRequest, current_user: dict = Depends(get_current_user)
):
    """
    Star Gmail messages by adding the STARRED label.

    - **message_ids**: List of Gmail message IDs to star

    Returns a list of IDs that were successfully starred.
    """
    try:
        service = get_gmail_service(current_user)
        modified_messages = star_messages(service, request.message_ids)

        return {
            "success": True,
            "starred": [msg["id"] for msg in modified_messages],
            "count": len(modified_messages),
            "status": "Messages starred",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to star messages: {str(e)}"
        )


@router.post("/gmail/unstar", summary="Unstar emails")
async def unstar_emails(
    request: EmailActionRequest, current_user: dict = Depends(get_current_user)
):
    """
    Unstar Gmail messages by removing the STARRED label.

    - **message_ids**: List of Gmail message IDs to unstar

    Returns a list of IDs that were successfully unstarred.
    """
    try:
        service = get_gmail_service(current_user)
        modified_messages = unstar_messages(service, request.message_ids)

        return {
            "success": True,
            "unstarred": [msg["id"] for msg in modified_messages],
            "count": len(modified_messages),
            "status": "Messages unstarred",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to unstar messages: {str(e)}"
        )


@router.post("/gmail/trash", summary="Move emails to trash")
async def trash_emails(
    request: EmailActionRequest, current_user: dict = Depends(get_current_user)
):
    """
    Move Gmail messages to trash.

    - **message_ids**: List of Gmail message IDs to move to trash

    Returns a list of IDs that were successfully moved to trash.
    """
    try:
        service = get_gmail_service(current_user)
        modified_messages = trash_messages(service, request.message_ids)

        return {
            "success": True,
            "trashed": [msg["id"] for msg in modified_messages],
            "count": len(modified_messages),
            "status": "Messages moved to trash",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to move messages to trash: {str(e)}"
        )


@router.post("/gmail/untrash", summary="Restore emails from trash")
async def untrash_emails(
    request: EmailActionRequest, current_user: dict = Depends(get_current_user)
):
    """
    Restore Gmail messages from trash.

    - **message_ids**: List of Gmail message IDs to restore from trash

    Returns a list of IDs that were successfully restored from trash.
    """
    try:
        service = get_gmail_service(current_user)
        modified_messages = untrash_messages(service, request.message_ids)

        return {
            "success": True,
            "restored": [msg["id"] for msg in modified_messages],
            "count": len(modified_messages),
            "status": "Messages restored from trash",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to restore messages from trash: {str(e)}"
        )


@router.post("/gmail/archive", summary="Archive emails")
async def archive_emails(
    request: EmailActionRequest, current_user: dict = Depends(get_current_user)
):
    """
    Archive Gmail messages by removing the INBOX label.

    - **message_ids**: List of Gmail message IDs to archive

    Returns a list of IDs that were successfully archived.
    """
    try:
        service = get_gmail_service(current_user)
        modified_messages = archive_messages(service, request.message_ids)

        return {
            "success": True,
            "archived": [msg["id"] for msg in modified_messages],
            "count": len(modified_messages),
            "status": "Messages archived",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to archive messages: {str(e)}"
        )


@router.post("/gmail/move-to-inbox", summary="Move emails to inbox")
async def move_emails_to_inbox(
    request: EmailActionRequest, current_user: dict = Depends(get_current_user)
):
    """
    Move Gmail messages to inbox by adding the INBOX label.

    - **message_ids**: List of Gmail message IDs to move to inbox

    Returns a list of IDs that were successfully moved to inbox.
    """
    try:
        service = get_gmail_service(current_user)
        modified_messages = move_to_inbox(service, request.message_ids)

        return {
            "success": True,
            "moved_to_inbox": [msg["id"] for msg in modified_messages],
            "count": len(modified_messages),
            "status": "Messages moved to inbox",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to move messages to inbox: {str(e)}"
        )


@router.get("/gmail/thread/{thread_id}", summary="Get complete email thread")
async def get_thread(thread_id: str, current_user: dict = Depends(get_current_user)):
    """
    Fetch a complete email thread with all messages.

    - **thread_id**: The Gmail thread ID to fetch

    Returns the thread with all its messages in chronological order.
    """
    try:
        service = get_gmail_service(current_user)
        thread = fetch_thread(service, thread_id)

        return {
            "thread_id": thread_id,
            "messages_count": len(thread.get("messages", [])),
            "thread": thread,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch email thread: {str(e)}"
        )
