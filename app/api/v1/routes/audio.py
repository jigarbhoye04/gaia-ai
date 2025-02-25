import asyncio
import base64

from dotenv import load_dotenv
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import Response

from app.db.db_redis import get_cache, set_cache
from app.models.audio_models import TTSRequest
from app.services.audio_service import AssemblyAITranscriber, TTSService
from app.utils.audio_utils import generate_cache_key, sanitize_text
from app.utils.logging_util import get_logger

load_dotenv()

router = APIRouter()
logger = get_logger(name="audio", log_file="audio.log")


tts_service = TTSService()


@router.post("/synthesize", responses={200: {"content": {"audio/wav": {}}}})
async def synthesize(request: TTSRequest):
    # Sanitize input text
    sanitized_text = sanitize_text(request.text)
    print(sanitized_text)
    # Log only a snippet of sanitized text to avoid exposing raw input
    logger.info(f"Received TTS request for sanitized text: {sanitized_text[:50]}...")

    # Generate a robust cache key using the entire sanitized text
    cache_key = generate_cache_key(sanitized_text)

    # Attempt to retrieve from cache with error handling.
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
            # If cache decoding fails, fall back to synthesizing speech.

    # Wrap TTS synthesis in error handling.
    try:
        tts_result = await tts_service.synthesize_speech(
            text=sanitized_text,
            language_code=request.language_code,
            voice_name=request.voice_name,
        )
    except Exception as e:
        logger.error("TTS synthesis failed: %s", str(e))
        return Response(content=b"Error during TTS synthesis.", status_code=500)

    # Cache the new TTS result with error handling.
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
    """
    WebSocket endpoint for real-time transcription.
    Accepts audio bytes from the client and sends back transcription results.
    """
    await websocket.accept()
    loop = asyncio.get_event_loop()

    def result_callback(message: str):
        """
        Callback to send transcription results to the WebSocket client.

        Args:
            message (str): The transcription message.
        """
        # Use asyncio.run_coroutine_threadsafe to safely send messages from a background thread.
        asyncio.run_coroutine_threadsafe(websocket.send_text(message), loop)

    transcriber = AssemblyAITranscriber(result_callback=result_callback)
    transcriber.start()

    try:
        while True:
            # Receive audio bytes from the client (sent from React)
            data = await websocket.receive_bytes()
            transcriber.send_audio(data)
    except WebSocketDisconnect:
        # Client disconnected, stop transcription
        transcriber.stop()
    except Exception as e:
        transcriber.stop()
        await websocket.send_text("Error: " + str(e))
