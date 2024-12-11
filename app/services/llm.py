import requests
from dotenv import load_dotenv

load_dotenv()
system_prompt: str = """You are an Assistant who's name is GAIA - a general purpose artificial intelligence assistant. Your responses should be concise and clear If you're asked who created you then you were created by Aryan Randeriya. Your responses should be concise and to the point. If you do not know something, be clear that you do not know it. You can setup calendar events, manage your files on google drive, assist in every day tasks and more!"""

url = "https://llm.aryanranderiya1478.workers.dev/"


def doPrompt(prompt: str):
    response = requests.post(
        url, json={"prompt": prompt, "stream": "true"}, stream=True
    )

    if response.status_code == 200:
        for line in response.iter_lines():
            if line:
                yield line.decode("utf-8") + "\n\n"
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


# print(
#     doPromptNoStream("""
#  Generate a detailed roadmap for "learning cloud computing" in valid JSON format. The response must meet the following criteria:

# 1. Do **not** include any introductions, explanations, or closing remarks.
# 2. Output must be **strictly valid JSON** with no additional text outside the JSON block.
# 3. Follow this structure exactly:

# {
#   "nodes": [
#     {
#       "id": "1",
#       "title": "HTML & CSS",
#       "group": "Beginner",
#       "description": "Learn the basics of structuring web pages and styling them.",
#       "tips": "Focus on semantic HTML and modern CSS features like Flexbox and Grid.",
#       "resources": [
#         "https://developer.mozilla.org/en-US/docs/Learn/HTML",
#         "https://developer.mozilla.org/en-US/docs/Learn/CSS"
#       ],
#       "x": 100,
#       "y": 100
#     },
#     ...
#   ],
#   "edges": [
#     {
#       "id": "e1-2",
#       "source": "1",
#       "target": "2",
#       "label": "Build on HTML & CSS"
#     },
#     ...
#   ]
# }

# ### Additional Details:
# - Ensure all `id`s, `title`s, `description`s, `tips`, and `resources` are relevant and well-structured.
# - Include meaningful relationships between nodes as `edges`.
# - Ensure logical spacing for `x` and `y` coordinates to avoid overlaps.

# Output **only** the JSON.

# """)
# )
