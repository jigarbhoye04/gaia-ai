from vosk import Model, KaldiRecognizer
import json
from google.oauth2 import service_account
import httpx
from fastapi import HTTPException
import google.auth.transport.requests as requests
from pathlib import Path
import os
from typing import List
import asyncio
from app.utils.logging_util import get_logger
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=2)

logger = get_logger(name="app", log_file="app.log")


class TTSService:
    def __init__(self):
        logger.info("Initializing TTSService.")

        def find_service_account_file(filename="gtts-secret.json"):
            current_dir = Path(__file__).resolve().parent
            for _ in range(3):
                potential_path = current_dir / "config" / filename
                if potential_path.exists():
                    return str(potential_path)
                current_dir = current_dir.parent
            raise FileNotFoundError(f"Could not find {filename}")

        service_account_path = find_service_account_file()
        self.credentials = service_account.Credentials.from_service_account_file(
            service_account_path,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )

        request = requests.Request()
        self.credentials.refresh(request)
        logger.info("TTSService initialized successfully.")

    async def synthesize_speech(
        self,
        text: str,
        language_code: str = "en-GB",
        voice_name: str = "en-GB-Journey-F",
    ):
        try:
            logger.info(f"Starting speech synthesis for text: {text[:50]}...")
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
                    logger.error(f"TTS API error: {response.text}")
                    raise HTTPException(
                        status_code=response.status_code, detail=response.text
                    )

                result = response.json()
                audio_content = result.get("audioContent")

                if not audio_content:
                    logger.error("No audio content received from TTS API.")
                    raise HTTPException(status_code=400, detail="No audio content")

                logger.info("Speech synthesis completed successfully.")
                return audio_content

        except Exception as e:
            logger.error(f"Error during TTS synthesis: {e}")
            raise HTTPException(status_code=500, detail=str(e))


class VoskTranscriber:
    def __init__(self, model_path: str = "app/assets/models/vosk-model-en-us-0.22"):
        self.model_path = os.path.abspath(model_path)
        self.model = None
        self.recognizer = None
        logger.info(f"Initialized VoskTranscriber with model path: {self.model_path}")

    async def load_model(self) -> None:
        if self.model and self.recognizer:
            logger.info("Model already loaded. Skipping initialization.")
            return

        if not os.path.exists(self.model_path):
            logger.error(f"Model path does not exist: {self.model_path}")
            raise FileNotFoundError(f"Model path does not exist: {self.model_path}")

        loop = asyncio.get_event_loop()
        self.model = await loop.run_in_executor(None, Model, self.model_path)
        self.recognizer = KaldiRecognizer(self.model, 16000)
        self.recognizer.SetWords(True)
        self.recognizer.SetPartialWords(True)
        logger.info("Model and recognizer loaded successfully.")

    async def process_audio_stream(self, audio_stream: bytes) -> List[str]:
        logger.info("Processing audio stream.")
        loop = asyncio.get_event_loop()
        text_results = []

        for chunk in audio_stream:
            result_available = await loop.run_in_executor(
                executor, self.recognizer.AcceptWaveform, chunk
            )

            if result_available:
                result = json.loads(self.recognizer.Result())
                text_results.append(result.get("text", ""))
                logger.debug(f"Final result: {result.get('text', '')}")
            else:
                partial_result = json.loads(self.recognizer.PartialResult())
                logger.debug(f"Partial result: {partial_result.get('partial', '')}")

        final_result = json.loads(self.recognizer.FinalResult())
        text_results.append(final_result.get("text", ""))
        logger.info("Completed audio stream processing.")
        return text_results
