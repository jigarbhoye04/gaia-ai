import json
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.models.mail_models import EmailRequest, EmailSummaryRequest, SendEmailRequest
from app.services.llm_service import do_prompt_no_stream
from app.services.mail_service import (
    fetch_detailed_messages,
    get_gmail_service,
    send_email,
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
        notes = await search_notes_by_similarity(
            input_text=request.prompt, user_id=current_user.get("user_id")
        )

        prompt = f"""
        You are an expert professional email writer. Your task is to generate a well-structured, engaging, and contextually appropriate email based on the sender's request. Follow these detailed instructions:

        EXTREMELY IMPORTANT Guidelines:
        1. Analyze the provided email details carefully to understand the context.
        2. If the current subject is "empty", generate a compelling subject line that accurately reflects the email's purpose.
        3. Maintain a professional and appropriate tone, unless explicitly instructed otherwise.
        4. Ensure logical coherence and clarity in the email structure.
        5. Do not include any additional commentary, headers, or titles outside of the email content.
        6. Use proper markdown for readability where necessary, but avoid excessive formatting.
        7. Do not hallucinate, fabricate information, or add anything off-topic or irrelevant.
        8. The output must strictly follow the JSON format:
        {{"subject": "Your generated subject line here", "body": "Your generated email body here"}}
        9. Provide the JSON response so that it is extremely easy to parse and stringify.
        10. Ensure the JSON output is valid, with all special characters (like newlines) properly escaped, and without any additional commentary. 
        11. Do not add any additional text, explanations, or commentary before or after the JSON.

        Email Structure:
        - Greeting: Begin with a courteous and contextually appropriate greeting.
        - Introduction: Provide a concise introduction to set the tone.
        - Main Body: Clearly convey the main message, ensuring clarity and engagement.
        - Closing: End with a professional closing, an appropriate call to action (if needed), and a proper sign-off.

        User-Specified Modifications:  

        Writing Style: Adjust the writing style based on user preference. The available options are:  
            - Formal: Professional and structured.  
            - Friendly: Warm, engaging, and conversational.  
            - Casual: Relaxed and informal.  
            - Persuasive: Convincing and compelling.  
            - Humorous: Lighthearted and witty (if appropriate).  

        Content Length: Modify the response length according to user preference:  
            - None: Keep the content as is.  
            - Shorten: Condense the content while retaining key details.  
            - Lengthen: Expand the content with additional relevant details.  
            - Summarize: Generate a concise summary while maintaining key points.  

        Clarity Adjustments: Improve readability based on the following options:  
            - None: No changes to clarity.  
            - Simplify: Make the language easier to understand.  
            - Rephrase: Restructure sentences for better flow and readability.  

        Additional Context:
        - Sender Name: {current_user.get("name") or "none"} 
        - Current Subject: {request.subject or "empty"}
        - Current Body: {request.body or "empty"}
        - Writing Style: {request.writingStyle or "Professional"}
        - Content Length Preference: {request.contentLength or "None"}
        - Clarity Preference: {request.clarityOption or "None"}
        - User Notes (from database): {"- ".join(notes) if notes else "No relevant notes found."}

        Only mention user notes when relevant to the email context.

        The user want's to write an email for: {request.prompt}.
        Now, generate a well-structured email accordingly.
        """

        result = await do_prompt_no_stream(prompt=prompt,model="@cf/meta/llama-3.3-70b-instruct-fp8-fast",)
        print(result)
        if isinstance(result, dict) and result.get("response"):
            try:
                parsed_result = json.loads(result["response"])
                subject = parsed_result.get("subject", "")
                body = parsed_result.get("body", "")

                return {"subject": subject, "body": body}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to parse response {e}")
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
    current_user: dict = Depends(get_current_user)
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
        profile = service.users().getProfile(userId='me').execute()
        sender = profile.get('emailAddress')
        
        # Parse recipients
        to_list = [email.strip() for email in to.split(',') if email.strip()]
        cc_list = [email.strip() for email in cc.split(',')] if cc else None
        bcc_list = [email.strip() for email in bcc.split(',')] if bcc else None
        
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
            attachments=attachments
        )
        
        return {
            "message_id": sent_message.get('id'),
            "status": "Email sent successfully",
            "attachments_count": len(attachments) if attachments else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


@router.post("/gmail/send-json", summary="Send an email using JSON payload")
async def send_email_json(
    request: SendEmailRequest,
    current_user: dict = Depends(get_current_user)
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
        profile = service.users().getProfile(userId='me').execute()
        sender = profile.get('emailAddress')
        
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
            attachments=None
        )
        
        return {
            "message_id": sent_message.get('id'),
            "status": "Email sent successfully"
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
        message = service.users().messages().get(
            userId='me', 
            id=request.message_id,
            format='full'
        ).execute()
        
        # Transform the message into a readable format
        email_data = transform_gmail_message(message)
        
        # Prepare the prompt for the LLM
        prompt = f"""You are an expert email assistant. Please summarize the following email concisely and professionally.

Email Subject: {email_data.get('subject', 'No Subject')}
From: {email_data.get('from', 'Unknown')}
Date: {email_data.get('time', 'Unknown')}

Email Content:
{email_data.get('body', email_data.get('snippet', 'No content available'))}

Please provide a summary of this email in {request.max_length or 150} words or less.

{" Include the key points of the email." if request.include_key_points else ""}
{" Identify any action items or requests made in the email." if request.include_action_items else ""}

Format your response as a JSON object with the following structure:
{{
    "summary": "The concise summary of the email",
    "key_points": ["Key point 1", "Key point 2", ...],
    "action_items": ["Action item 1", "Action item 2", ...],
    "sentiment": "A brief description of the email's tone/sentiment (formal, urgent, friendly, etc.)"
}}
"""
        
        # Call the LLM service to generate the summary
        llm_response = await do_prompt_no_stream(prompt)
        
        return {
            "email_id": request.message_id,
            "email_subject": email_data.get('subject', 'No Subject'),
            "result": llm_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to summarize email: {str(e)}")
