from fastapi import APIRouter, UploadFile, File, HTTPException, status, Form
from pydantic import BaseModel
import datetime
from app.db.connect import documents_collection
from app.api.v1.notes import generate_embedding
from fastapi import Depends
from app.middleware.auth import get_current_user
from app.services.llm import doPromptNoStream
from app.utils.embeddings import query_documents
from app.services.text import split_text_into_chunks
import fitz

router = APIRouter()


class DocumentUploadResponse(BaseModel):
    conversation_id: str
    message: str


class DocumentQueryRequest(BaseModel):
    message: str
    conversation_id: str


class DocumentUploadRequest(BaseModel):
    conversation_id: str


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
    Upload a document, generate embeddings for each chunk, and associate it with a unique conversation ID.
    """
    try:
        content = await file.read()

        # Extract text from PDF or decode plain text file
        if file.filename.endswith(".pdf"):
            doc = fitz.open(stream=content, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
        else:
            text = content.decode("utf-8")

        # Chunk the document
        chunks = split_text_into_chunks(text)

        # Process each chunk individually
        for chunk_text in chunks:
            embedding = generate_embedding(chunk_text)

            # Insert each chunk as a separate document with embedding
            await documents_collection.insert_one(
                {
                    "title": file.filename,
                    "content": chunk_text,
                    "user_id": user.get("user_id"),
                    "conversation_id": conversation_id,
                    "upload_date": datetime.datetime.utcnow(),
                    "embedding": embedding,
                }
            )

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
        # Step 1: Process the uploaded document (if any)
        content = await file.read()

        # Extract text from PDF or decode plain text file
        if file.filename.endswith(".pdf"):
            doc = fitz.open(stream=content, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
        else:
            text = content.decode("utf-8")

        # Step 2: Split the document into chunks
        chunks = split_text_into_chunks(text)

        # Step 3: Upload the chunks and generate embeddings for each chunk
        for chunk_text in chunks:
            embedding = generate_embedding(chunk_text)

            # Insert each chunk as a separate document with embedding
            await documents_collection.insert_one(
                {
                    "title": file.filename,
                    "content": chunk_text,
                    "user_id": user.get("user_id"),
                    "conversation_id": conversation_id,
                    "upload_date": datetime.datetime.utcnow(),
                    "embedding": embedding,
                }
            )

        print(f"{len(text)=}")
        if len(text) > 10000:
            # Query for the most relevant chunks for the provided conversation ID
            documents = await query_documents(
                message, conversation_id, user.get("user_id")
            )

            content = [document["content"] for document in documents]
            titles = [document["title"] for document in documents]
            prompt = f"Question: {message}\n\nContext from documents uploaded by the user:\n{ {'document_names': titles, 'content': content} }"
        else:
            documents = await query_documents(
                message, conversation_id, user.get("user_id")
            )

            prompt = f"Question: {message}\n\nContext from documents uploaded by the user:\n{ {'document_name': file.filename, 'content': text} }"

        print(content)

        response = await doPromptNoStream(prompt)

        return {
            "response": response,
            "message": "Document uploaded and query processed successfully.",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
