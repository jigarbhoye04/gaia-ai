from fastapi import APIRouter, WebSocket
from fastapi.responses import Response
from vosk import Model, KaldiRecognizer
import json
from google.oauth2 import service_account
import httpx
from fastapi import HTTPException
from pydantic import BaseModel
import google.auth.transport.requests
import base64
from pathlib import Path

router = APIRouter()

class VoskTranscriber:
    def __init__(self):
        self.model = Model(model_name="vosk-model-en-us-0.22")
        self.recognizer = KaldiRecognizer(self.model, 16000)
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


transcriber = VoskTranscriber()


@router.websocket("/transcribe")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            audio_chunk = await websocket.receive_bytes()

            # Process audio chunk
            text = transcriber.process_chunk(audio_chunk)

            if text:
                await websocket.send_text(text)

    except Exception as e:
        print(f"Error: {str(e)}")


class TTSRequest(BaseModel):
    text: str
    language_code: str = "en-GB"
    voice_name: str = "en-GB-Journey-F"


class TTSService:
    def __init__(self):
        # Dynamic service account path resolution
        def find_service_account_file(filename="gtts-secret.json"):
            current_dir = Path(__file__).resolve().parent
            for _ in range(3):
                potential_path = current_dir / "utils" / filename
                if potential_path.exists():
                    return str(potential_path)
                current_dir = current_dir.parent
            raise FileNotFoundError(f"Could not find {filename}")

        # Load service account credentials
        service_account_path = find_service_account_file()
        self.credentials = service_account.Credentials.from_service_account_file(
            service_account_path,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )

        # Refresh token
        request = google.auth.transport.requests.Request()
        self.credentials.refresh(request)

    async def synthesize_speech(
        self,
        text: str,
        language_code: str = "en-GB",
        voice_name: str = "en-GB-Journey-F",
    ):
        try:
            # Get access token
            access_token = self.credentials.token

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
            }

            payload = {
                "input": {"text": text},
                "voice": {"languageCode": language_code, "name": voice_name},
                "audioConfig": {"audioEncoding": "LINEAR16"},
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://texttospeech.googleapis.com/v1/text:synthesize",
                    json=payload,
                    headers=headers,
                )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code, detail=response.text
                    )

                result = response.json()
                audio_content = result.get("audioContent")

                if not audio_content:
                    raise HTTPException(status_code=400, detail="No audio content")

                return base64.b64decode(audio_content)

        except Exception as e:
            print(f"Synthesis error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@router.post("/synthesize", responses={200: {"content": {"audio/wav": {}}}})
async def synthesize(request: TTSRequest):
    tts_service = TTSService()
    audio_bytes = await tts_service.synthesize_speech(
        text=request.text,
        language_code=request.language_code,
        voice_name=request.voice_name,
    )
    return Response(content=audio_bytes, media_type="audio/wav")
