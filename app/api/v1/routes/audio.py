import asyncio
import base64

from app.config.settings import settings
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import Response

from app.db.db_redis import get_cache, set_cache
from app.models.audio_models import TTSRequest
from app.services.audio_service import TTSService
from app.utils.audio_utils import generate_cache_key, sanitize_text
from app.utils.logging_util import get_logger

router = APIRouter()
logger = get_logger(name="audio", log_file="audio.log")

DEEPGRAM_API_KEY = settings.DEEPGRAM_API_KEY

tts_service = TTSService()


class DeepgramTranscriber:
    """
    Transcriber using Deepgram's SDK for real-time transcription.
    """

    def __init__(self, result_callback):
        self.result_callback = result_callback
        self.dg_connection = None

    def start(self):
        from deepgram import DeepgramClient, LiveOptions, LiveTranscriptionEvents

        logger.info("Initializing Deepgram client.")
        deepgram = DeepgramClient(DEEPGRAM_API_KEY)
        self.dg_connection = deepgram.listen.websocket.v("1")
        logger.info("Deepgram WebSocket connection object created.")

        # Correctly defined callback function based on Deepgram SDK expectations
        self.dg_connection.on(
            LiveTranscriptionEvents.Transcript, self.handle_transcript
        )
        logger.info("Registered transcript callback.")

        options = LiveOptions(
            model="nova-3", language="en", smart_format=True, interim_results=False
        )
        logger.info("Starting Deepgram connection with options: %s", options)
        if self.dg_connection.start(options) is False:
            logger.error("Failed to start Deepgram connection.")
            raise Exception("Failed to start Deepgram connection.")
        logger.info("Deepgram connection started successfully.")

    def handle_transcript(self, *args, **kwargs):
        # Extract the result from either args or kwargs
        result = args[0] if args else kwargs.get("result")
        try:
            if (
                hasattr(result, "channel")
                and hasattr(result.channel, "alternatives")
                and len(result.channel.alternatives) > 0
            ):
                transcript = result.channel.alternatives[0].transcript
                if transcript:
                    logger.info("Received transcript from Deepgram: %s", transcript)
                    self.result_callback(transcript)
                else:
                    logger.debug("Received empty transcript.")
            else:
                logger.warning("Unexpected result structure: %s", str(result))
        except Exception as e:
            logger.error("Error processing transcript: %s", str(e))
            logger.error("Result data: %s", str(result))

    def send_audio(self, data: bytes):
        if self.dg_connection:
            logger.debug("Sending audio data of length: %d", len(data))
            self.dg_connection.send(data)
        else:
            logger.warning("Attempted to send audio data without an active connection.")

    def stop(self):
        if self.dg_connection:
            logger.info("Stopping Deepgram connection.")
            self.dg_connection.finish()
        else:
            logger.warning("No active Deepgram connection to stop.")


@router.post("/synthesize", responses={200: {"content": {"audio/wav": {}}}})
async def synthesize(request: TTSRequest):
    sanitized_text = sanitize_text(request.text)
    logger.info("Received TTS request for sanitized text: %s", sanitized_text[:50])
    cache_key = generate_cache_key(sanitized_text)

    try:
        from_cache = await get_cache(cache_key)
    except Exception as e:
        logger.error("Error accessing cache: %s", str(e))
        from_cache = None

    if from_cache:
        logger.info("Cache hit for TTS request.")
        try:
            decoded_audio = base64.b64decode(from_cache)
            return Response(content=decoded_audio, media_type="audio/wav")
        except Exception as e:
            logger.error("Error decoding cached audio: %s", str(e))

    try:
        tts_result = await tts_service.synthesize_speech(
            text=sanitized_text,
            language_code=request.language_code,
            voice_name=request.voice_name,
        )
    except Exception as e:
        logger.error("TTS synthesis failed: %s", str(e))
        return Response(content=b"Error during TTS synthesis.", status_code=500)

    try:
        await set_cache(cache_key, tts_result, ttl=2628000)
        logger.info("Cache set for TTS result.")
    except Exception as e:
        logger.error("Error setting cache: %s", str(e))

    try:
        decoded_audio = base64.b64decode(tts_result)
        return Response(content=decoded_audio, media_type="audio/wav")
    except Exception as e:
        logger.error("Error decoding TTS result: %s", str(e))
        return Response(content=b"Error processing TTS result.", status_code=500)


@router.websocket("/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection accepted for transcription.")
    loop = asyncio.get_event_loop()

    def result_callback(message: str):
        logger.info("Transcription callback triggered with message: %s", message)
        asyncio.run_coroutine_threadsafe(websocket.send_text(message), loop)

    transcriber = DeepgramTranscriber(result_callback=result_callback)
    try:
        transcriber.start()
        logger.info("Transcriber started successfully.")
    except Exception as e:
        logger.error("DeepgramTranscriber failed to start: %s", str(e))
        await websocket.send_text("Error: " + str(e))
        return

    try:
        while True:
            data = await websocket.receive_bytes()
            logger.debug("Received audio data chunk of length: %d", len(data))
            transcriber.send_audio(data)
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")
        transcriber.stop()
    except Exception as e:
        logger.error("Error during transcription: %s", str(e))
        await websocket.send_text("Error: " + str(e))
        transcriber.stop()
