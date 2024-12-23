from fastapi.responses import JSONResponse
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import datetime
import time
import logging
from app.db.connect import documents_collection, document_chunks_collection
from app.services.text import split_text_into_chunks
from app.services.llm import doPromptNoStream
from app.services.document import convert_pdf_to_text, extract_text_from_pdf


model = SentenceTransformer("all-MiniLM-L6-v2")
router = APIRouter()


class QueryModel(BaseModel):
    query_text: str
    top_k: int = 5


@router.post("/document/upload")
async def upload_document(file: UploadFile = File(...)):
    start_time = time.time()
    logging.info(f"Starting document upload: {file.filename}")

    try:
        # Existing code...
        content = await file.read()
        text = extract_text_from_pdf(content)

        # Split the text into chunks
        chunks = split_text_into_chunks(text)
        logging.info(f"Text extracted and split into {len(chunks)} chunks")

        result = await documents_collection.insert_one(
            {
                "title": file.filename,
                "upload_date": datetime.datetime.now().isoformat(),
                "embedding_metadata": {
                    "model": "all-MiniLM-L6-v2",
                    "vector_size": 384,
                },
            }
        )

        logging.info("Encoding all chunks into embeddings")
        embeddings_list = model.encode(chunks).tolist()

        documents = [
            {
                "document_id": result.inserted_id,
                "chunk_index": idx,
                "text": chunk,
                "embeddings": embeddings,
            }
            for idx, (chunk, embeddings) in enumerate(zip(chunks, embeddings_list))
        ]

        logging.info("Batch processing completed")
        await document_chunks_collection.insert_many(documents)

        end_time = time.time()
        total_time = end_time - start_time
        logging.info(f"Document processing completed in {total_time:.2f} seconds")

        return {
            "message": "Document uploaded, split into chunks, and embeddings stored successfully!",
            "total_chunks": len(chunks),
            "processing_time": total_time,
        }
    except Exception as e:
        logging.error(f"Error processing document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/document/query")
async def query_similar_documents(query: QueryModel):
    """
    Search for the top_k most relevant chunks based on the input query text.
    Doesn't pass chunks to LLM.
    """
    try:
        # Generate embedding for the query text
        query_embedding = model.encode([query.query_text])[0].tolist()

        # Retrieve all chunks with embeddings from the database
        cursor = document_chunks_collection.find(
            {}, {"embeddings": 1, "text": 1, "chunk_index": 1}
        )
        chunks = await cursor.to_list(None)

        if not chunks:
            raise HTTPException(
                status_code=404, detail="No document chunks found in the database."
            )

        # Prepare embeddings and metadata
        embeddings = []
        metadata = []
        for chunk in chunks:
            embeddings.append(chunk["embeddings"])
            metadata.append(
                {
                    "text": chunk["text"],
                    "chunk_index": chunk["chunk_index"],
                }
            )

        # Compute cosine similarity between query_embedding and all chunk embeddings
        embeddings_array = np.array(embeddings)
        query_array = np.array(query_embedding).reshape(1, -1)
        similarities = cosine_similarity(query_array, embeddings_array).flatten()

        # Get top_k results
        top_indices = np.argsort(similarities)[::-1][: query.top_k]
        top_results = [
            {
                "chunk_index": metadata[idx]["chunk_index"],
                "text": metadata[idx]["text"],
                "similarity": similarities[idx],
            }
            for idx in top_indices
        ]

        return {
            "query_text": query.query_text,
            "top_k": query.top_k,
            "results": top_results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/document/query/prompt")
async def query_and_prompt(query: QueryModel):
    """
    Search for the top_k most relevant chunks based on the input query text.
    Passes chunks to LLM.
    """
    try:
        # Generate embedding for the query text
        query_embedding = model.encode([query.query_text])[0].tolist()

        # Retrieve all chunks with embeddings from the database
        cursor = document_chunks_collection.find(
            {}, {"embeddings": 1, "text": 1, "chunk_index": 1}
        )
        chunks = await cursor.to_list(None)

        if not chunks:
            raise HTTPException(
                status_code=404, detail="No document chunks found in the database."
            )

        # Prepare embeddings and metadata
        embeddings = []
        metadata = []
        for chunk in chunks:
            embeddings.append(chunk["embeddings"])
            metadata.append(
                {
                    "text": chunk["text"],
                    # "filename": chunk["filename"],
                    "chunk_index": chunk["chunk_index"],
                }
            )

        # Compute cosine similarity between query_embedding and all chunk embeddings
        embeddings_array = np.array(embeddings)
        query_array = np.array(query_embedding).reshape(1, -1)
        similarities = cosine_similarity(query_array, embeddings_array).flatten()

        # Get top_k results
        top_indices = np.argsort(similarities)[::-1][: query.top_k]
        top_results = [
            {
                # "filename": metadata[idx]["filename"],
                # "chunk_index": metadata[idx]["chunk_index"],
                "text": metadata[idx]["text"],
                "similarity": similarities[idx],
            }
            for idx in top_indices
        ]

        response = await doPromptNoStream(f"""
            Context (this is unformmated text extracted from the user uploaded document):  {top_results},
            Question: {query.query_text}
        """)

        return {
            "query_text": query.query_text,
            "response": response,
            "top_k": query.top_k,
            "results": top_results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


#! DEPRECATED NEEDS TO BE MODIFIED
@router.post("/document")
async def upload_file(message: str = Form(...), file: UploadFile = File(...)):
    contents = await file.read()
    converted_text = convert_pdf_to_text(contents)
    prompt = f"""
        You can understand documents.
        Document name: {file.filename},
        Content type: {file.content_type},
        Size in bytes: {len(contents)}.
        This is the document (converted to text for your convenience): {converted_text}
        I want you to do this: {message}.
    """

    response = await doPromptNoStream(prompt)
    return JSONResponse(content=response)
