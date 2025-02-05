from app.services.llm import doPromptCloudflareSDK
import json


async def should_create_memory(message: str) -> bool:
    """
    Use a Hugging Face model to classify if a message should be stored as a memory.
    """
    try:
        result = await doPromptCloudflareSDK(
            prompt=f""" This is the message: {message}""",
            system_prompt=f"""
            You are an intelligent AI model designed to determine whether a message should be remembered by an AI assistant.

            Consider **any** message that might be useful for future interactions. This may include, but is not limited to:
            - Personal details, preferences, or facts about the user.
            - Important events, reminders, or to-do tasks.
            - Information about relationships, conversations, or interactions.
            - Any other context that might improve the assistant’s ability to personalize responses.

            Instead of following a strict list, use your reasoning ability to determine if this message contains information **that would be valuable for future conversations**.

            Return **ONLY** a JSON response in this exact format:
            ```json
            {{
            "is_memory": true  // or false,
            "content":"A description of the main content of the note of the user in HTML format with proper formatting. In first person perspective of the user.",
            "plaintext":"A description of the main content of the user's note of the user in plaintext. In first person perspective of the user. This will be the same as the content but with the html tags parsed and converted to a noral string",
            }} 
            ```
            STRICT RULES:
            - Do NOT include any text other than the JSON object.
            - Ensure valid JSON syntax.
            - Provide the JSON in a single line with no new lines or pretty printing.
            """,
        )

        if isinstance(result, str):
            try:
                result = json.loads(result.replace("\n", ""))
            except json.JSONDecodeError:
                return (
                    False,
                    None,
                    None,
                )

        print(f"{result=}")
        is_memory = result.get("is_memory")

        if isinstance(is_memory, bool):
            return (
                is_memory,
                result.get("plaintext"),
                result.get("content"),
            )

        else:
            return (
                False,
                None,
                None,
            )

    except Exception:
        return (
            False,
            None,
            None,
        )
