import json
from typing import Optional

from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.config.loggers import notes_logger as logger
from app.db.chromadb import ChromaClient
from app.db.collections import notes_collection
from app.db.redis import delete_cache, set_cache
from app.models.notes_models import NoteModel, NoteResponse
from app.prompts.system.notes_prompts import MEMORY_CREATOR


class Memory(BaseModel):
    """Important details to remember"""

    plaintext: Optional[str] = Field(
        description="A description of the main content of the note of the user in HTML format with proper formatting (only use the html tags where necessary for specific elements). In first person perspective of the user."
    )
    content: Optional[str] = Field(
        description="A description of the main content of the user's note of the user in plaintext. In first person perspective of the user. This will be the same as the content but with the html tags parsed and converted to a normal string"
    )
    is_memory: bool = Field(
        description="A boolean value indicating is note passed query requirements, if true generate plaintext and content."
    )


# chat_model = init_chat_model("@cf/meta/llama-3.3-70b-instruct-fp8-fast")
chat_model = init_chat_model("llama-3.1-8b-instant", model_provider="groq")
chat_model.with_structured_output(Memory)


async def insert_note(
    note: NoteModel,
    user_id: str,
    auto_created=False,
) -> NoteResponse:
    logger.info(f"Creating new note for user: {user_id}")
    chromadb_client = ChromaClient.get_client()

    note_data = note.model_dump()
    note_data["user_id"] = user_id
    note_data["auto_created"] = auto_created
    result = await notes_collection.insert_one(note_data)
    note_id = str(result.inserted_id)

    # Add note to ChromaDB for vector search
    if chromadb_client:
        chroma_notes_collection = await chromadb_client.get_collection(name="notes")

        await chroma_notes_collection.add(
            documents=[note.plaintext],
            metadatas=[
                {
                    "note_id": note_id,
                    "user_id": user_id,
                }
            ],
            ids=[note_id],
        )
        logger.info(f"Note with id {note_id} indexed in ChromaDB")

    response_data = {
        "id": note_id,
        "content": note_data["content"],
        "plaintext": note_data["plaintext"],
        "user_id": user_id,
        "auto_created": note_data.get("auto_created", False),
        "title": note_data.get("title"),
        "description": note_data.get("description"),
    }

    await delete_cache(f"notes:{user_id}")

    await set_cache(f"note:{user_id}:{note_id}", response_data)
    logger.info(f"Note created with ID: {note_id} and cache updated")

    return NoteResponse(**response_data)


async def should_create_memory(
    message: str,
) -> tuple[bool, None, None] | tuple[bool, str, str]:
    try:
        prompt_template = ChatPromptTemplate.from_messages(
            [("system", MEMORY_CREATOR), ("user", "This is the message: {message}")]
        )

        prompt = prompt_template.invoke({"message": message})

        response = chat_model.invoke(prompt)
        response_dict = json.loads(response.to_json())

        memory = Memory.model_validate(response_dict)
        is_memory = memory.is_memory
        plaintext = memory.plaintext
        content = memory.content

        if is_memory and plaintext and content:
            return (is_memory, plaintext, content)
        else:
            return (False, None, None)
    except json.JSONDecodeError:
        logger.error("Failed to decode JSON response from LLM")
        return (False, None, None)
    except ValueError:
        logger.error("Failed to validate response from LLM")
        return (False, None, None)
    except TypeError:
        logger.error("Type error in response from LLM")
        return (False, None, None)
    except KeyError:
        logger.error("Key error in response from LLM")
        return (False, None, None)
    except RuntimeError:
        logger.error("Runtime error in response from LLM")
        return (False, None, None)
    except Exception:
        return (False, None, None)


async def store_note(query_text: str, user_id: str) -> None:
    """
    Store a note if the query meets memory creation criteria.
    """
    is_memory, plaintext, content = await should_create_memory(query_text)
    if is_memory and content and plaintext:
        await insert_note(
            note=NoteModel(plaintext=plaintext, content=content),
            user_id=user_id,
            auto_created=True,
        )
