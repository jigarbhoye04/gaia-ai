import json
from typing import Annotated, Any, Dict, List, Optional

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool

from app.config.loggers import chat_logger as logger
from app.docstrings.langchain.tools.mail_tool_docs import (
    LIST_GMAIL_LABELS,
    LIST_GMAIL_MESSAGES,
    SEARCH_GMAIL_MESSAGES,
    SUMMARIZE_EMAIL,
    COMPOSE_EMAIL,
    MARK_EMAILS_AS_READ,
    MARK_EMAILS_AS_UNREAD,
    STAR_EMAILS,
    UNSTAR_EMAILS,
    ARCHIVE_EMAILS,
    MOVE_EMAILS_TO_INBOX,
    GET_EMAIL_THREAD,
    CREATE_GMAIL_LABEL,
    UPDATE_GMAIL_LABEL,
    DELETE_GMAIL_LABEL,
    APPLY_LABELS_TO_EMAILS,
    REMOVE_LABELS_FROM_EMAILS,
    CREATE_EMAIL_DRAFT,
    LIST_EMAIL_DRAFTS,
    GET_EMAIL_DRAFT,
    UPDATE_EMAIL_DRAFT,
    DELETE_EMAIL_DRAFT,
    SEND_EMAIL_DRAFT,
    GET_GMAIL_CONTACTS,
)
from app.docstrings.utils import with_doc
from app.langchain.prompts.mail_prompts import EMAIL_COMPOSER, EMAIL_SUMMARIZER
from app.langchain.templates.mail_templates import (
    draft_template,
    process_get_thread_response,
    process_list_drafts_response,
    process_list_labels_response,
    process_list_messages_response,
    process_search_messages_response,
)
from app.services.mail_service import (
    apply_labels,
    archive_messages,
    create_draft,
    create_label,
    delete_draft,
    delete_label,
    fetch_detailed_messages,
    fetch_thread,
    get_contact_list,
    get_draft,
    get_gmail_service,
    list_drafts,
    mark_messages_as_read,
    mark_messages_as_unread,
    move_to_inbox,
    remove_labels,
    search_messages,
    send_draft,
    star_messages,
    unstar_messages,
    update_draft,
    update_label,
)
from app.utils.chat_utils import do_prompt_no_stream
from app.utils.general_utils import transform_gmail_message


def get_auth_from_config(config: RunnableConfig) -> Dict[str, str]:
    """Extract access and refresh tokens from the config."""
    if not config:
        logger.error("Gmail tool called without config")
        return {"access_token": "", "refresh_token": ""}

    configurable = config.get("configurable", {})
    return {
        "access_token": configurable.get("access_token", ""),
        "refresh_token": configurable.get("refresh_token", ""),
    }


@tool
@with_doc(LIST_GMAIL_LABELS)
async def list_gmail_labels(config: RunnableConfig) -> Dict[str, Any]:
    try:
        logger.info("Gmail Tool: Listing Gmail labels")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {"error": "Authentication credentials not provided", "labels": []}

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        results = service.users().labels().list(userId="me").execute()

        # Process results to minimize data
        return process_list_labels_response({"labels": results.get("labels", [])})
    except Exception as e:
        error_msg = f"Error listing Gmail labels: {str(e)}"
        logger.error(error_msg)
        # Return minimal error response
        return {"error": error_msg, "labels": []}


@tool
@with_doc(LIST_GMAIL_MESSAGES)
async def list_gmail_messages(
    config: RunnableConfig,
    max_results: Annotated[
        int, "Maximum number of messages to fetch (default: 20)"
    ] = 20,
    page_token: Annotated[
        Optional[str], "Token for pagination, if fetching subsequent pages"
    ] = None,
) -> Dict[str, Any]:
    try:
        logger.info(
            f"Gmail Tool: Listing inbox messages (max: {max_results}, token: {page_token})"
        )
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "error": "Authentication credentials not provided",
                "messages": [],
                "nextPageToken": None,
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        # Prepare params for message list
        params = {"userId": "me", "labelIds": ["INBOX"], "maxResults": max_results}
        if page_token:
            params["pageToken"] = page_token

        # Fetch message list
        results = service.users().messages().list(**params).execute()
        messages = results.get("messages", [])

        # Use batching to fetch full details for each message
        detailed_messages = fetch_detailed_messages(service, messages)

        # Transform messages to standard format first, then process to minimize
        transformed_messages = [
            transform_gmail_message(msg) for msg in detailed_messages
        ]

        # Process to minimize data for LLM
        return process_list_messages_response(
            {
                "messages": transformed_messages,
                "nextPageToken": results.get("nextPageToken"),
            }
        )
    except Exception as e:
        error_msg = f"Error listing Gmail messages: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "messages": [], "nextPageToken": None}


@tool
@with_doc(SEARCH_GMAIL_MESSAGES)
async def search_gmail_messages(
    config: RunnableConfig,
    query: Annotated[Optional[str], "Free text search query"] = None,
    sender: Annotated[Optional[str], "Filter by sender email"] = None,
    recipient: Annotated[Optional[str], "Filter by recipient email"] = None,
    subject: Annotated[Optional[str], "Filter by subject"] = None,
    has_attachment: Annotated[
        Optional[bool], "Filter for messages with attachments"
    ] = None,
    attachment_type: Annotated[
        Optional[str], "Filter by attachment type (e.g., pdf, doc)"
    ] = None,
    date_from: Annotated[
        Optional[str], "Filter messages after this date (YYYY/MM/DD)"
    ] = None,
    date_to: Annotated[
        Optional[str], "Filter messages before this date (YYYY/MM/DD)"
    ] = None,
    label: Annotated[Optional[str], "Filter by label"] = None,
    is_read: Annotated[Optional[bool], "Filter by read/unread status"] = None,
    max_results: Annotated[
        int, "Maximum number of results to return (default: 20)"
    ] = 20,
    page_token: Annotated[Optional[str], "Token for pagination"] = None,
) -> Dict[str, Any]:
    try:
        logger.info(
            f"Gmail Tool: Searching messages with criteria: query={query}, sender={sender}, etc."
        )
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "error": "Authentication credentials not provided",
                "messages": [],
                "nextPageToken": None,
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        # Build Gmail query string from parameters
        query_parts = []

        if query:
            query_parts.append(f"{query}")
        if sender:
            query_parts.append(f"from:{sender}")
        if recipient:
            query_parts.append(f"to:{recipient}")
        if subject:
            query_parts.append(f"subject:{subject}")
        if has_attachment is not None:
            query_parts.append(
                "has:attachment" if has_attachment else "-has:attachment"
            )
        if attachment_type:
            query_parts.append(f"filename:{attachment_type}")
        if date_from:
            query_parts.append(f"after:{date_from}")
        if date_to:
            query_parts.append(f"before:{date_to}")
        if label:
            query_parts.append(f"label:{label}")
        if is_read is not None:
            query_parts.append("is:read" if is_read else "is:unread")

        # Combine all query parts
        gmail_query = " ".join(query_parts)

        search_results = search_messages(
            service=service,
            query=gmail_query,
            max_results=max_results,
            page_token=page_token,
        )

        # Process to minimize the search results data
        return process_search_messages_response(search_results)
    except Exception as e:
        error_msg = f"Error searching Gmail messages: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "messages": [], "nextPageToken": None}


@tool
@with_doc(SUMMARIZE_EMAIL)
async def summarize_email(
    config: RunnableConfig,
    message_id: Annotated[str, "The Gmail message ID to summarize"],
    include_action_items: Annotated[
        Optional[bool], "Whether to include action items in the summary"
    ] = False,
    max_length: Annotated[
        Optional[int], "Maximum length of the summary in words"
    ] = 150,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Summarizing email {message_id}")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {"error": "Authentication credentials not provided"}

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        # Fetch the message
        message = (
            service.users()
            .messages()
            .get(userId="me", id=message_id, format="full")
            .execute()
        )

        if not message:
            return {"error": f"Message with ID {message_id} not found"}

        email_data = transform_gmail_message(message)

        action_items_instruction = (
            "Identify any action items or requests made in the email."
            if include_action_items
            else ""
        )

        prompt = EMAIL_SUMMARIZER.format(
            subject=email_data.get("subject", "No Subject"),
            sender=email_data.get("from", "Unknown"),
            date=email_data.get("time", "Unknown"),
            content=email_data.get(
                "body", email_data.get("snippet", "No content available")
            ),
            max_length=max_length or 150,
            action_items_instruction=action_items_instruction,
        )

        # Call the LLM service to generate the summary
        llm_response = await do_prompt_no_stream(prompt)

        # Use a minimal template for the response
        return {
            "email_id": message_id,
            "email_subject": email_data.get("subject", "No Subject"),
            "email_date": email_data.get("time", "Unknown"),
            "email_sender": email_data.get("from", "Unknown"),
            "result": llm_response,
        }
    except Exception as e:
        error_msg = f"Error summarizing email: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg}


@tool
@with_doc(COMPOSE_EMAIL)
async def compose_email(
    config: RunnableConfig,
    prompt: Annotated[str, "Prompt describing what kind of email to compose"],
    subject: Annotated[
        Optional[str], "Optional subject to include in the prompt"
    ] = None,
    body: Annotated[
        Optional[str], "Optional body text to include in the prompt"
    ] = None,
    writing_style: Annotated[
        Optional[str], "Writing style (e.g., Professional, Casual, Formal)"
    ] = "Professional",
    content_length: Annotated[
        Optional[str], "Desired length (e.g., Brief, Detailed)"
    ] = None,
    clarity_option: Annotated[
        Optional[str], "Clarity option (e.g., Simple, Technical)"
    ] = None,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Composing email with prompt: {prompt}")

        user_name = (
            config.get("configurable", {}).get("user_name", "") if config else ""
        )

        prompt_template = EMAIL_COMPOSER.format(
            sender_name=user_name or "none",
            subject=subject or "empty",
            body=body or "empty",
            writing_style=writing_style or "Professional",
            content_length=content_length or "None",
            clarity_option=clarity_option or "None",
            prompt=prompt,
        )

        result = await do_prompt_no_stream(prompt=prompt_template)

        if isinstance(result, dict) and result.get("response"):
            try:
                parsed_result = json.loads(result["response"])
                subject = parsed_result.get("subject", "")
                body = parsed_result.get("body", "")

                return {"subject": subject, "body": body}
            except Exception as e:
                error_msg = f"Failed to parse response: {str(e)}"
                logger.error(error_msg)
                return {"error": error_msg}
        else:
            error_msg = "Invalid response format"
            logger.error(error_msg)
            return {"error": error_msg}
    except Exception as e:
        error_msg = f"Error composing email: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg}


@tool
@with_doc(MARK_EMAILS_AS_READ)
async def mark_emails_as_read(
    message_ids: Annotated[List[str], "List of Gmail message IDs to mark as read"],
    config: RunnableConfig,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Marking {len(message_ids)} emails as read")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        mark_messages_as_read(service, message_ids)

        return {"success": True, "message_ids": message_ids}
    except Exception as e:
        error_msg = f"Error marking emails as read: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@tool
@with_doc(MARK_EMAILS_AS_UNREAD)
async def mark_emails_as_unread(
    message_ids: Annotated[List[str], "List of Gmail message IDs to mark as unread"],
    config: RunnableConfig,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Marking {len(message_ids)} emails as unread")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        result = mark_messages_as_unread(service, message_ids)

        return {"success": True, "message_ids": message_ids, "result": result}
    except Exception as e:
        error_msg = f"Error marking emails as unread: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@tool
@with_doc(STAR_EMAILS)
async def star_emails(
    message_ids: Annotated[List[str], "List of Gmail message IDs to star"],
    config: RunnableConfig,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Starring {len(message_ids)} emails")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        result = star_messages(service, message_ids)

        return {"success": True, "message_ids": message_ids, "result": result}
    except Exception as e:
        error_msg = f"Error starring emails: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@tool
@with_doc(UNSTAR_EMAILS)
async def unstar_emails(
    message_ids: Annotated[List[str], "List of Gmail message IDs to unstar"],
    config: RunnableConfig,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Unstarring {len(message_ids)} emails")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        result = unstar_messages(service, message_ids)

        return {"success": True, "message_ids": message_ids, "result": result}
    except Exception as e:
        error_msg = f"Error unstarring emails: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@tool
@with_doc(ARCHIVE_EMAILS)
async def archive_emails(
    message_ids: Annotated[List[str], "List of Gmail message IDs to archive"],
    config: RunnableConfig,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Archiving {len(message_ids)} emails")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        result = archive_messages(service, message_ids)

        return {"success": True, "message_ids": message_ids, "result": result}
    except Exception as e:
        error_msg = f"Error archiving emails: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@tool
@with_doc(MOVE_EMAILS_TO_INBOX)
async def move_emails_to_inbox(
    message_ids: Annotated[List[str], "List of Gmail message IDs to move to inbox"],
    config: RunnableConfig,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Moving {len(message_ids)} emails to inbox")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        result = move_to_inbox(service, message_ids)

        return {"success": True, "message_ids": message_ids, "result": result}
    except Exception as e:
        error_msg = f"Error moving emails to inbox: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@tool
@with_doc(GET_EMAIL_THREAD)
async def get_email_thread(
    thread_id: Annotated[str, "The Gmail thread ID to fetch"],
    config: RunnableConfig,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Getting email thread {thread_id}")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {"error": "Authentication credentials not provided"}

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        thread = fetch_thread(service, thread_id)

        # Process to minimize data for LLM
        return process_get_thread_response(thread)
    except Exception as e:
        error_msg = f"Error fetching email thread: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg}


@tool
@with_doc(CREATE_GMAIL_LABEL)
async def create_gmail_label(
    config: RunnableConfig,
    name: Annotated[str, "Name for the new label"],
    label_list_visibility: Annotated[
        Optional[str],
        "Whether the label appears in the label list (labelShow, labelHide, labelShowIfUnread)",
    ] = "labelShow",
    message_list_visibility: Annotated[
        Optional[str], "Whether the label appears in the message list (show, hide)"
    ] = "show",
    background_color: Annotated[
        Optional[str], "Background color hex code (e.g., #f5f5f5)"
    ] = None,
    text_color: Annotated[Optional[str], "Text color hex code (e.g., #000000)"] = None,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Creating label '{name}'")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        label = create_label(
            service,
            name=name,
            label_list_visibility=label_list_visibility or "labelShow",
            message_list_visibility=message_list_visibility or "show",
            background_color=background_color,
            text_color=text_color,
        )

        return {"success": True, "label": label}
    except Exception as e:
        error_msg = f"Error creating Gmail label: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@tool
@with_doc(UPDATE_GMAIL_LABEL)
async def update_gmail_label(
    config: RunnableConfig,
    label_id: Annotated[str, "ID of the label to update"],
    name: Annotated[Optional[str], "New name for the label"] = None,
    label_list_visibility: Annotated[
        Optional[str],
        "Whether the label appears in the label list (labelShow, labelHide, labelShowIfUnread)",
    ] = None,
    message_list_visibility: Annotated[
        Optional[str], "Whether the label appears in the message list (show, hide)"
    ] = None,
    background_color: Annotated[
        Optional[str], "Background color hex code (e.g., #f5f5f5)"
    ] = None,
    text_color: Annotated[Optional[str], "Text color hex code (e.g., #000000)"] = None,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Updating label '{label_id}'")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        label = update_label(
            service,
            label_id=label_id,
            name=name,
            label_list_visibility=label_list_visibility,
            message_list_visibility=message_list_visibility,
            background_color=background_color,
            text_color=text_color,
        )

        return {"success": True, "label": label}
    except Exception as e:
        error_msg = f"Error updating Gmail label: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@tool
@with_doc(DELETE_GMAIL_LABEL)
async def delete_gmail_label(
    label_id: Annotated[str, "ID of the label to delete"],
    config: RunnableConfig,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Deleting label '{label_id}'")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        result = delete_label(service, label_id)

        return {"success": result, "label_id": label_id}
    except Exception as e:
        error_msg = f"Error deleting Gmail label: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@tool
@with_doc(APPLY_LABELS_TO_EMAILS)
async def apply_labels_to_emails(
    message_ids: Annotated[List[str], "List of Gmail message IDs to label"],
    label_ids: Annotated[List[str], "List of label IDs to apply"],
    config: RunnableConfig,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Applying labels to {len(message_ids)} emails")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        # Apply labels without storing the result
        apply_labels(service, message_ids, label_ids)

        # Return success status without the full result data
        return {
            "success": True,
            "message_ids": message_ids,
            "labels_applied": label_ids,
        }
    except Exception as e:
        error_msg = f"Error applying labels to emails: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@tool
@with_doc(REMOVE_LABELS_FROM_EMAILS)
async def remove_labels_from_emails(
    message_ids: Annotated[
        List[str], "List of Gmail message IDs to remove labels from"
    ],
    label_ids: Annotated[List[str], "List of label IDs to remove"],
    config: RunnableConfig,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Removing labels from {len(message_ids)} emails")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        # Remove labels without storing the result
        remove_labels(service, message_ids, label_ids)

        # Return success status without the full result data
        return {
            "success": True,
            "message_ids": message_ids,
            "labels_removed": label_ids,
        }
    except Exception as e:
        error_msg = f"Error removing labels from emails: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@tool
@with_doc(CREATE_EMAIL_DRAFT)
async def create_email_draft(
    config: RunnableConfig,
    to: Annotated[List[str], "List of recipient email addresses"],
    subject: Annotated[str, "Email subject"],
    body: Annotated[str, "Email body/content"],
    cc: Annotated[Optional[List[str]], "List of CC recipients"] = None,
    bcc: Annotated[Optional[List[str]], "List of BCC recipients"] = None,
    is_html: Annotated[
        Optional[bool], "Whether the body contains HTML formatting"
    ] = False,
) -> Dict[str, Any]:
    try:
        logger.info(
            f"Gmail Tool: Creating draft email to {to} with subject '{subject}'"
        )
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        # Get user's email address
        profile = service.users().getProfile(userId="me").execute()
        sender = profile.get("emailAddress")

        draft = create_draft(
            service,
            sender=sender,
            to_list=to,
            subject=subject,
            body=body,
            is_html=bool(is_html),
            cc_list=cc,
            bcc_list=bcc,
        )

        return {"success": True, "draft": draft}
    except Exception as e:
        error_msg = f"Error creating email draft: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@tool
@with_doc(LIST_EMAIL_DRAFTS)
async def list_email_drafts(
    config: RunnableConfig,
    max_results: Annotated[int, "Maximum number of drafts to fetch (default: 20)"] = 20,
    page_token: Annotated[Optional[str], "Token for pagination"] = None,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Listing drafts (max: {max_results})")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {"error": "Authentication credentials not provided", "drafts": []}

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        drafts = list_drafts(service, max_results, page_token)

        # Process to minimize data for LLM
        return process_list_drafts_response(drafts)
    except Exception as e:
        error_msg = f"Error listing email drafts: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg, "drafts": []}


@tool
@with_doc(GET_EMAIL_DRAFT)
async def get_email_draft(
    draft_id: Annotated[str, "ID of the draft to fetch"],
    config: RunnableConfig,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Getting draft {draft_id}")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {"error": "Authentication credentials not provided"}

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        draft = get_draft(service, draft_id)

        # Convert to minimal format
        return {"draft": draft_template(draft)}
    except Exception as e:
        error_msg = f"Error getting email draft: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg}


@tool
@with_doc(UPDATE_EMAIL_DRAFT)
async def update_email_draft(
    config: RunnableConfig,
    draft_id: Annotated[str, "ID of the draft to update"],
    to: Annotated[List[str], "List of recipient email addresses"],
    subject: Annotated[str, "Email subject"],
    body: Annotated[str, "Email body/content"],
    cc: Annotated[Optional[List[str]], "List of CC recipients"] = None,
    bcc: Annotated[Optional[List[str]], "List of BCC recipients"] = None,
    is_html: Annotated[
        Optional[bool], "Whether the body contains HTML formatting"
    ] = False,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Updating draft {draft_id}")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        # Get user's email address
        profile = service.users().getProfile(userId="me").execute()
        sender = profile.get("emailAddress")

        draft = update_draft(
            service,
            draft_id=draft_id,
            sender=sender,
            to_list=to,
            subject=subject,
            body=body,
            is_html=bool(is_html),
            cc_list=cc,
            bcc_list=bcc,
        )

        return {"success": True, "draft": draft}
    except Exception as e:
        error_msg = f"Error updating email draft: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@tool
@with_doc(DELETE_EMAIL_DRAFT)
async def delete_email_draft(
    draft_id: Annotated[str, "ID of the draft to delete"],
    config: RunnableConfig,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Deleting draft {draft_id}")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        result = delete_draft(service, draft_id)

        return {"success": result, "draft_id": draft_id}
    except Exception as e:
        error_msg = f"Error deleting email draft: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@tool
@with_doc(SEND_EMAIL_DRAFT)
async def send_email_draft(
    draft_id: Annotated[str, "ID of the draft to send"],
    config: RunnableConfig,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Sending draft {draft_id}")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        message = send_draft(service, draft_id)

        return {"success": True, "message": message}
    except Exception as e:
        error_msg = f"Error sending email draft: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@tool
@with_doc(GET_GMAIL_CONTACTS)
async def get_gmail_contacts(
    config: RunnableConfig,
    max_results: Annotated[
        int,
        "Maximum number of messages to analyze for contact extraction (default: 100)",
    ] = 100,
) -> Dict[str, Any]:
    try:
        logger.info(f"Gmail Tool: Getting contacts from {max_results} messages")
        auth = get_auth_from_config(config)

        if not auth["access_token"] or not auth["refresh_token"]:
            return {
                "success": False,
                "error": "Authentication credentials not provided",
                "contacts": [],
            }

        service = get_gmail_service(
            access_token=auth["access_token"], refresh_token=auth["refresh_token"]
        )

        contacts = get_contact_list(service, max_results=max_results)

        return {"success": True, "contacts": contacts, "count": len(contacts)}
    except Exception as e:
        error_msg = f"Error getting Gmail contacts: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg, "contacts": []}


mail_tools = [
    list_gmail_labels,
    list_gmail_messages,
    search_gmail_messages,
    summarize_email,
    compose_email,
    mark_emails_as_read,
    mark_emails_as_unread,
    star_emails,
    unstar_emails,
    archive_emails,
    move_emails_to_inbox,
    get_email_thread,
    create_gmail_label,
    update_gmail_label,
    delete_gmail_label,
    apply_labels_to_emails,
    remove_labels_from_emails,
    create_email_draft,
    list_email_drafts,
    get_email_draft,
    update_email_draft,
    delete_email_draft,
    send_email_draft,
]
