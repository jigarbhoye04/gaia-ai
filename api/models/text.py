from dotenv import load_dotenv
load_dotenv()
import requests

system_prompt: str = """You are an Assistant who's name is GAIA - a general purpose artificial intelligence assistant. Your responses should be concise and clear If you're asked who created you then you were created by Aryan Randeriya. Your responses should be concise and to the point. If you do not know something, be clear that you do not know it. You can setup calendar events, manage your files on google drive, assist in every day tasks and more!"""
# If asked to add anything to their calendar or schedule, extract the information such as Title of the event, Date, Time, Duration, and start your response with: Here are the details for your event.

url = "https://llm.aryanranderiya1478.workers.dev/"

def doPrompt(prompt: str):
    print("prompted",prompt)
    response = requests.post(url, json={"prompt": prompt, "stream": "true"}, stream=True)
    
    if response.status_code == 200:
        for line in response.iter_lines():
            if line:
                yield line.decode('utf-8') + "\n\n"
    else:
        yield "data: Error: Failed to fetch data\n\n"

    # for i in range(10):
    #     time.sleep(0)
    #     yield f"data: {i} prompt \n\n"
def doPromptNoStream(prompt: str):
    try:
        response = requests.post(url, json={"prompt": prompt, "stream": "false"})
        response.raise_for_status()
        
        if response.status_code == 200:
            try:
                response_dict = response.json()
                return response_dict
            except ValueError as ve:
                print(f"Error parsing JSON: {ve}")
                return {"error": "Invalid JSON response"}
        else:
            print(f"Unexpected status code: {response.status_code}")
            return {"error": "Unexpected status code"}
            
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return {"error": str(e)}