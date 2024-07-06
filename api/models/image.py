import requests

def generate_image(imageprompt:str):
    url = "https://generateimage.aryanranderiya1478.workers.dev/"
    data = {"imageprompt": imageprompt}
    response = requests.post(url, json=data)
    return response.content
