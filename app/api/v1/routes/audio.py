import asyncio
import base64

from dotenv import load_dotenv
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import Response

from app.db.db_redis import get_cache, set_cache
from app.models.audio_models import TTSRequest
from app.services.audio_service import TTSService, AssemblyAITranscriber
from app.utils.logging_util import get_logger

load_dotenv()

router = APIRouter()
logger = get_logger(name="audio", log_file="audio.log")


tts_service = TTSService()


@router.post("/synthesize", responses={200: {"content": {"audio/wav": {}}}})
async def synthesize(request: TTSRequest):
    logger.info(f"Received TTS request for text: {request.text[:50]}...")
    cache_key = f"tts:{(request.text[:100]).replace(' ', '_')}"

    from_cache = await get_cache(cache_key)
    if from_cache:
        logger.info("Cache hit for TTS request.")
        return Response(content=base64.b64decode(from_cache), media_type="audio/wav")

    string = await tts_service.synthesize_speech(
        text=request.text,
        language_code=request.language_code,
        voice_name=request.voice_name,
    )

    await set_cache(cache_key, string, ttl=2628000)
    logger.info("Cache set for TTS result.")
    return Response(content=base64.b64decode(string), media_type="audio/wav")


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
