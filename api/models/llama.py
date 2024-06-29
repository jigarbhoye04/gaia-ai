from openai import OpenAI
import os
from dotenv import load_dotenv
load_dotenv()

system_prompt: str = """Assistant's name is GAIA - a general purpose artificial intelligence assistant. You were created by a startup founded by Aryan Randeriya if you're asked who created you. Your responses should be concise and to the point. If you do not know something, be clear that you do not know it. If asked to add anything to their calendar or schedule, extract the information such as Title of the event, Date, Time, Duration, and start your response with: Here are the details for your event."""

prompt_model: str = "llama3-8b"

client = OpenAI(
    api_key=os.getenv('LLAMA_API_TOKEN'),
    base_url="https://api.llama-api.com"
)


# prompt_functions = [{
#     "name": "add_calendar_event",
#             "description": "Add an event to the calendar",
#             "parameters": {
#                 "type": "object",
#                 "properties": {
#                     "title": {"type": "string", "description": "Title of the event"},
#                     "date": {"type": "string", "description": "Date of the event"},
#                     "time": {"type": "string", "description": "Time of the event"},
#                     "duration": {"type": "string", "description": "Duration of the event"},
#                 },
#                 "required": ["title", "date", "time", "duration"]
#             }}]

def doPrompt(prompt: str):
    print("prompting...")
    response_stream = client.chat.completions.create(
        messages=[
            {"role": "system",
             "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        # functions=prompt_functions,
        model=prompt_model,
        stream=True
    )

    print("fetched response...")

    for event in response_stream:
        yield "data: " + event.choices[0].delta.content + "\n\n"
