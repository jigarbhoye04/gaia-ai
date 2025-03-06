import json
from typing import Any
from app.services.llm_service import do_prompt_no_stream


async def should_create_memory(
    message: str,
) -> tuple[bool, None, None] | tuple[bool, Any, Any]:
    try:
        result = await do_prompt_no_stream(
            prompt=f"This is the message: {message}",
            model="@cf/meta/llama-3.3-70b-instruct-fp8-fast",
            system_prompt="""
                You are an intelligent AI model designed to determine whether a message should be remembered by an AI assistant.

                Consider any message that might be useful for future interactions. Focus on statements made by the user, not on questions. This may include, but is not limited to:
                - Personal details, preferences, or facts about the user.
                - Important events, reminders, or to-do tasks. (not calendar events as they are already being added to the calendar. only add extremely important events that are mandatory to be remembered)
                - Information about relationships, conversations, or interactions.
                - Any other context that might improve the assistant’s ability to personalize responses.

                Instead of following a strict list, use your reasoning ability to determine if this message contains information that would be valuable for future conversations.

                Return ONLY a JSON response in this exact format:
                {"is_memory": true, "content": "A description of the main content of the note of the user in HTML format with proper formatting (only use the html tags where necessary for specific elements). In first person perspective of the user.", "plaintext": "A description of the main content of the user's note of the user in plaintext. In first person perspective of the user. This will be the same as the content but with the html tags parsed and converted to a normal string"}
                STRICT RULES:
                - Do NOT include any text other than the JSON object.
                - Ensure valid JSON syntax.
                - Provide the JSON in a single line with no new lines or pretty printing.
                - Only include the content and the plaintext if is_memory is True, otherwise just do them as None.
            """,
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
