from datetime import timezone
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Form, Depends
import datetime
import fitz
from app.db.collections import documents_collection
from app.utils.notes import generate_embedding
from app.services.llm_service import do_prompt_no_stream
from app.utils.embedding_utils import query_documents
from app.services.text_service import split_text_into_chunks
from app.models.document_moels import DocumentUploadResponse
from app.api.v1.dependencies.oauth_dependencies import get_current_user
from prompts.user.document_prompts import DOCUMENT_QUERY_LARGE, DOCUMENT_QUERY_SMALL

router = APIRouter()


def extract_text(file: UploadFile, content: bytes) -> str:
    """Extract text from the uploaded file. Supports PDF and plain text files."""
    if file.filename.endswith(".pdf"):
        doc = fitz.open(stream=content, filetype="pdf")
        return "".join(page.get_text() for page in doc)
    else:
        return content.decode("utf-8")


async def process_document_upload(
    file: UploadFile, user: dict, conversation_id: str, upload_date: datetime.datetime
) -> str:
    """
    Read file content, extract text, split into chunks, generate embeddings,
    and insert each chunk into the documents collection.
    Returns the full extracted text.
    """
    content_bytes = await file.read()
    text = extract_text(file, content_bytes)
    chunks = split_text_into_chunks(text)
    for chunk in chunks:
        embedding = generate_embedding(chunk)
        await documents_collection.insert_one(
            {
                "title": file.filename,
                "content": chunk,
                "user_id": user.get("user_id"),
                "conversation_id": conversation_id,
                "upload_date": upload_date,
                "embedding": embedding,
            }
        )
    return text


@router.post(
    "/document",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    conversation_id: str = Form(...),
    user: dict = Depends(get_current_user),
    file: UploadFile = File(...),
):
    """
    Upload a document, generate embeddings for each chunk, and associate it with a conversation ID.
    """
    try:
        upload_date = datetime.datetime.now(timezone.utc)
        _ = await process_document_upload(file, user, conversation_id, upload_date)
        return {
            "message": "Document uploaded and chunked successfully.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/document/query",
    status_code=status.HTTP_201_CREATED,
)
async def query_with_document(
    message: str = Form(...),
    conversation_id: str = Form(...),
    user: dict = Depends(get_current_user),
    file: UploadFile = File(...),
):
    try:
        upload_date = datetime.datetime.now(timezone.utc)
        text = await process_document_upload(file, user, conversation_id, upload_date)

        if len(text) > 10000:
            documents = await query_documents(
                message, conversation_id, user.get("user_id")
            )
            content_list = [doc["content"] for doc in documents]
            titles = [doc["title"] for doc in documents]
            prompt = DOCUMENT_QUERY_LARGE.format(
                question=message,
                titles=titles,
                content=content_list
            )
        else:
            prompt = DOCUMENT_QUERY_SMALL.format(
                question=message,
                filename=file.filename,
                text=text
            )
        response = await do_prompt_no_stream(prompt)
        return {
            "response": response,
            "message": "Document uploaded and query processed successfully.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
