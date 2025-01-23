from fastapi import APIRouter, WebSocket
from vosk import Model, KaldiRecognizer
import json

router = APIRouter()

# Initialize Vosk model (download from https://alphacephei.com/vosk/models)
model = Model(model_name="vosk-model-en-us-0.22")


class VoskTranscriber:
    def __init__(self):
        self.recognizer = KaldiRecognizer(model, 16000)
        self.recognizer.SetWords(True)
        self.recognizer.SetPartialWords(True)

    def process_chunk(self, audio_chunk):
        if self.recognizer.AcceptWaveform(audio_chunk):
            result = json.loads(self.recognizer.Result())
            return result.get("text", "")
        else:
            # Get partial results
            result = json.loads(self.recognizer.PartialResult())
            return result.get("partial", "")


@router.websocket("/transcribe")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    transcriber = VoskTranscriber()

    try:
        while True:
            audio_chunk = await websocket.receive_bytes()

            # Process audio chunk
            text = transcriber.process_chunk(audio_chunk)

            if text:
                await websocket.send_text(text)

    except Exception as e:
        print(f"Error: {str(e)}")
