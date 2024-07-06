from dotenv import load_dotenv
load_dotenv()
import requests

system_prompt: str = """You are an Assistant who's name is GAIA - a general purpose artificial intelligence assistant. Your responses should be concise and clear If you're asked who created you then you were created by Aryan Randeriya. Your responses should be concise and to the point. If you do not know something, be clear that you do not know it. You can setup calendar events, manage your files on google drive, assist in every day tasks and more!"""
# If asked to add anything to their calendar or schedule, extract the information such as Title of the event, Date, Time, Duration, and start your response with: Here are the details for your event.

prompt_model: str = "meta/meta-llama-3-8b-instruct"

# import os
# import requests

# ACCOUNT_ID = "your-account-id"
# AUTH_TOKEN = os.environ.get("CLOUDFLARE_AUTH_TOKEN")

# prompt = "Tell me all about PEP-8"
# response = requests.post(
#   f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct",
#     headers={"Authorization": f"Bearer {AUTH_TOKEN}"},
#     json={
#       "messages": [
#         {"role": "system", "content": "You are a friendly assistant"},
#         {"role": "user", "content": prompt}
#       ]
#     }
# )
# result = response.json()
# return result.response

def doPrompt(prompt: str):
    url = "https://llm.aryanranderiya1478.workers.dev/"
    data = {"prompt": prompt}
    response = requests.post(url, json=data, stream=True)
    
    if response.status_code == 200:
        for line in response.iter_lines():
            if line:
                yield line.decode('utf-8') + "\n\n"
    else:
        yield "data: Error: Failed to fetch data\n\n"

    # for i in range(10):
    #     time.sleep(0)
    #     yield f"data: {i} prompt \n\n"

if __name__ == "__main__":
    prompt = "hey there how are you doing"
    for event in doPrompt(prompt):
        print(event)
