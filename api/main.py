from fastapi import FastAPI, UploadFile, HTTPException, Request,Response,File,Form
from fastapi.responses import StreamingResponse,JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import os
import uvicorn
import requests
import sys
import json
from api.input_validators import MessageRequest, MessageResponse, WaitlistItem,FeedbackFormData
from api.models.named_entity_recognition import parse_calendar_info
from api.models.zero_shot_classification import classify_event_type
from api.models.text import doPrompt,doPromptNoStream
from api.models.image import generate_image,convert_image_to_text
from api.functionality.document import convert_pdf_to_text
# from api.functionality.connect_gcal import get_events, authorize



app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
load_dotenv()

client = AsyncIOMotorClient(os.getenv("MONGO_DB"), server_api=ServerApi('1'))
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print("An Invalid URI host error was received. Is your Atlas host name correct in your connection string?")
    sys.exit(1)



@app.get("/")
def main():
    print("Pinged server successfully!")
    return True

@app.get("/getWaitlistMembers")
async def getWaitlistMembers():
    database = client["gaia-cluster"]
    signups = database["waitlist_signups"]
    emails = set()
    cursor = signups.find()
    members = await cursor.to_list(length=None)

    for member in members:
        emails.add(member['email'])
  
    return {"count": len(emails),"emails":emails}

@app.post("/waitlistSignup")
async def waitlist_signup(item: WaitlistItem):

    database = client["gaia-cluster"]
    collection = database["waitlist_signups"]

    try:
        item_dict = item.dict()
        result = await collection.insert_one(item_dict)

        if result.inserted_id:
            return {"message": "Data inserted successfully"}
        else:
            raise HTTPException(
                status_code=500, detail="Failed to insert data")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/submitFeedbackForm")
async def submitFeedbackForm(formData: FeedbackFormData):
    database = client["gaia-cluster"]
    collection = database["feedback_form"]

    try:
        item_dict = formData.dict()
        result = await collection.insert_one(item_dict)

        if result.inserted_id:
            return {"message": "Feedback Form Data inserted successfully"}
        else:
            raise HTTPException(
                status_code=500, detail="Failed to insert feedback form data")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


import time

@ app.post("/chat")
def chat(request: MessageRequest):
    return StreamingResponse(doPrompt(request.message), media_type='text/event-stream')


@ app.post("/generate_image")
def image(request:MessageRequest):
    image_bytes: bytes = generate_image(request.message)
    return Response(content=image_bytes, media_type="image/png")


@app.post("/image")
async def image(image: UploadFile = File(...)):
    response = await convert_image_to_text(image)
    return JSONResponse(content={"response": response})

@app.post("/document")
async def upload_file(
    message: str = Form(...),
    file: UploadFile = File(...)
):
    contents = await file.read()
    converted_text = convert_pdf_to_text(contents)
    prompt = f"""
        You can understand documents. 
        Document name: {file.filename}, 
        Content type: {file.content_type}, 
        Size in bytes: {len(contents)}.
        This is the document (converted to text for your convenience): {converted_text}
        I want you to do this: {message}. 
    """

    response = doPromptNoStream(prompt)
    return JSONResponse(content=response)

    

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
