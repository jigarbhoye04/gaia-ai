import json
from typing import Any
from app.services.llm_service import do_prompt_no_stream
from prompts.system.notes_prompts import MEMORY_CREATOR


async def should_create_memory(
    message: str,
) -> tuple[bool, None, None] | tuple[bool, Any, Any]:
    try:
        result = await do_prompt_no_stream(
            prompt=f"This is the message: {message}",
            model="@cf/meta/llama-3.3-70b-instruct-fp8-fast",
            system_prompt=MEMORY_CREATOR,
        )

        print(result, "result")

        if isinstance(result, str):
            try:
                result = json.loads(result.strip())
            except json.JSONDecodeError:
                return False, None, None

        elif isinstance(result, dict) and "response" in result:
            try:
                result = json.loads(result["response"].strip())
            except json.JSONDecodeError:
                return False, None, None
        else:
            return False, None, None

        is_memory = result.get("is_memory")

        if isinstance(is_memory, bool):
            return is_memory, result.get("plaintext"), result.get("content")

        return False, None, None

    except Exception:
        return (False, None, None)
