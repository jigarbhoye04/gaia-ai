from fastapi.responses import JSONResponse
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.llm import doPromptNoStream
from services.document import convert_pdf_to_text
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
from db.connect import document_vectors_collection 
from sklearn.metrics.pairwise import cosine_similarity
from services.text import split_text_into_chunks
from services.document import extract_text_from_pdf

model = SentenceTransformer("all-MiniLM-L6-v2")
router = APIRouter()

class QueryModel(BaseModel):
    query_text: str
    top_k: int = 5


@router.post("/document/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document, split it into chunks, generate embeddings for each chunk,
    and store in MongoDB.
    """
    try:
        # Read file content
        content = await file.read()
        text = extract_text_from_pdf(content)

        # Split the text into chunks
        chunks = split_text_into_chunks(text)

        # Generate embeddings for each chunk
        documents = []
        for idx, chunk in enumerate(chunks):
            embeddings = model.encode([chunk])[0].tolist()
            document = {
                "filename": file.filename,
                "chunk_index": idx,
                "chunk_text": chunk,
                "embeddings": embeddings,
            }
            documents.append(document)

        # Store all chunks in MongoDB
        await document_vectors_collection.insert_many(documents)

        return {
            "message": "Document uploaded, split into chunks, and embeddings stored successfully!",
            "total_chunks": len(chunks),
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

    response = doPromptNoStream(prompt)
    return JSONResponse(content=response)

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
        cursor = document_vectors_collection.find({}, {"embeddings": 1, "chunk_text": 1, "filename": 1, "chunk_index": 1})
        chunks = await cursor.to_list(None)
        
        if not chunks:
            raise HTTPException(status_code=404, detail="No document chunks found in the database.")
        
        # Prepare embeddings and metadata
        embeddings = []
        metadata = []
        for chunk in chunks:
            embeddings.append(chunk["embeddings"])
            metadata.append({
                "chunk_text": chunk["chunk_text"],
                "filename": chunk["filename"],
                "chunk_index": chunk["chunk_index"],
            })
        
        # Compute cosine similarity between query_embedding and all chunk embeddings
        embeddings_array = np.array(embeddings)
        query_array = np.array(query_embedding).reshape(1, -1)
        similarities = cosine_similarity(query_array, embeddings_array).flatten()
        
        # Get top_k results
        top_indices = np.argsort(similarities)[::-1][:query.top_k]
        top_results = [
            {
                "filename": metadata[idx]["filename"],
                "chunk_index": metadata[idx]["chunk_index"],
                "chunk_text": metadata[idx]["chunk_text"],
                "similarity": similarities[idx]
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


@router.post("/query")
async def query_similar_documents(query: QueryModel):
    """
    Search for the top_k most relevant chunks based on the input query text.
    Passes chunks to LLM.
    """
    try:
        # Generate embedding for the query text
        query_embedding = model.encode([query.query_text])[0].tolist()
        
        # Retrieve all chunks with embeddings from the database
        cursor = document_vectors_collection.find({}, {"embeddings": 1, "chunk_text": 1, "filename": 1, "chunk_index": 1})
        chunks = await cursor.to_list(None)
        
        if not chunks:
            raise HTTPException(status_code=404, detail="No document chunks found in the database.")
        
        # Prepare embeddings and metadata
        embeddings = []
        metadata = []
        for chunk in chunks:
            embeddings.append(chunk["embeddings"])
            metadata.append({
                "chunk_text": chunk["chunk_text"],
                "filename": chunk["filename"],
                "chunk_index": chunk["chunk_index"],
            })
        
        # Compute cosine similarity between query_embedding and all chunk embeddings
        embeddings_array = np.array(embeddings)
        query_array = np.array(query_embedding).reshape(1, -1)
        similarities = cosine_similarity(query_array, embeddings_array).flatten()
        
        # Get top_k results
        top_indices = np.argsort(similarities)[::-1][:query.top_k]
        top_results = [
            {
                "filename": metadata[idx]["filename"],
                # "chunk_index": metadata[idx]["chunk_index"],
                "chunk_text": metadata[idx]["chunk_text"],
                "similarity": similarities[idx]
            }
            for idx in top_indices
        ]
        
        response = doPromptNoStream(f"""
            Context: {top_results},
            Question: {query.query_text}
        """)

        return {
            "query_text": query.query_text,
            "response":response,
            "top_k": query.top_k,
            "results": top_results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
