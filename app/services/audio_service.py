import queue
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import assemblyai as aai
import google.auth.transport.requests as requests
import httpx
from fastapi import HTTPException
from google.oauth2 import service_account

from app.config.loggers import audio_logger as logger
from app.config.settings import settings

aai.settings.api_key = settings.ASSEMBLYAI_API_KEY

executor = ThreadPoolExecutor(max_workers=2)


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


class AudioStream:
    """
    A thread-safe iterator that yields audio bytes for AssemblyAI.
    """

    def __init__(self):
        self._queue = queue.Queue()
        self._finished = False

    def add_audio(self, data: bytes):
        """
        Adds audio data to the stream.

        Args:
            data (bytes): Audio data bytes.
        """
        self._queue.put(data)

    def finish(self):
        """
        Marks the stream as finished, signaling no more audio will be added.
        """
        self._finished = True
        self._queue.put(None)

    def __iter__(self):
        return self

    def __next__(self):
        if self._finished and self._queue.empty():
            raise StopIteration
        data = self._queue.get()
        if data is None:
            raise StopIteration
        return data


class AssemblyAITranscriber:
    """
    Handles real-time transcription using AssemblyAI's API.
    """

    def __init__(self, result_callback, sample_rate: int = 16000):
        """
        Initializes the transcriber.

        Args:
            result_callback (Callable[[str], None]): Function to call with transcription results.
            sample_rate (int): Audio sample rate.
        """
        self.result_callback = result_callback
        self.sample_rate = sample_rate
        self.audio_stream = None
        self.transcriber = None
        self.thread = None

    def on_open(self, session_opened: aai.RealtimeSessionOpened):
        """
        Callback when the transcription session is opened.
        """
        self.result_callback("Session ID: " + session_opened.session_id + "\r\n")

    def on_data(self, transcript: aai.RealtimeTranscript):
        """
        Callback for receiving transcript data.

        Args:
            transcript (aai.RealtimeTranscript): The transcript object.
        """
        if not transcript.text:
            return
        if isinstance(transcript, aai.RealtimeFinalTranscript):
            self.result_callback(transcript.text + "\r\n")
        else:
            self.result_callback(transcript.text)

    def on_error(self, error: aai.RealtimeError):
        """
        Callback for handling errors.

        Args:
            error (aai.RealtimeError): The error that occurred.
        """
        self.result_callback("An error occurred: " + str(error) + "\r\n")

    def on_close(self):
        """
        Callback for when the transcription session closes.
        """
        self.result_callback("Closing Session\r\n")

    def _run_stream(self):
        """
        Runs the transcription stream in a separate thread.
        """
        self.transcriber.stream(self.audio_stream)

    def start(self):
        """
        Starts the transcription session and the background thread.
        """
        self.audio_stream = AudioStream()
        self.transcriber = aai.RealtimeTranscriber(
            sample_rate=self.sample_rate,
            on_data=self.on_data,
            on_error=self.on_error,
            on_open=self.on_open,
            on_close=self.on_close,
        )
        self.transcriber.connect()
        self.thread = threading.Thread(target=self._run_stream, daemon=True)
        self.thread.start()

    def send_audio(self, data: bytes):
        """
        Sends audio data to the transcription stream.

        Args:
            data (bytes): Audio data bytes.
        """
        if self.audio_stream:
            self.audio_stream.add_audio(data)

    def stop(self):
        """
        Stops the transcription session, closing the stream and waiting for the background thread.
        """
        if self.audio_stream:
            self.audio_stream.finish()
        if self.transcriber:
            self.transcriber.close()
        if self.thread:
            self.thread.join()
