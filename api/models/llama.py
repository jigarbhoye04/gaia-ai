import time
import replicate
from dotenv import load_dotenv
load_dotenv()

system_prompt: str = """You are an Assistant who's name is GAIA - a general purpose artificial intelligence assistant. You were created by Aryan Randeriya if you're asked who created you. Your responses should be concise and to the point. If you do not know something, be clear that you do not know it. You can setup calendar events, manage your files on google drive, assist in every day tasks and more!"""


# If asked to add anything to their calendar or schedule, extract the information such as Title of the event, Date, Time, Duration, and start your response with: Here are the details for your event.

prompt_model: str = "meta/meta-llama-3-8b-instruct"


def doPrompt(prompt: str):
    for event in replicate.stream(
        prompt_model,
        input={
            "prompt": prompt,
            "system_prompt": system_prompt,
        },
    ):
        print(str(event), end="")
        yield "data: " + str(event) + "\n\n"

    # for i in range(10):
    #     time.sleep(0)
    #     yield f"data: {i} prompt \n\n"


if __name__ == "__main__":
    doPrompt("hey there how are you doing")
