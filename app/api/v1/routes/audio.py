from fastapi.responses import Response
from pydantic import BaseModel
import base64
from app.db.redis import get_cache, set_cache
from app.utils.logging import get_logger
from fastapi import APIRouter, WebSocket
from app.services.audio_service import TTSService, VoskTranscriber

router = APIRouter()
logger = get_logger(name="app", log_file="app.log")


class TTSRequest(BaseModel):
    text: str
    language_code: str = "en-GB"
    voice_name: str = "en-GB-Journey-F"


tts_service = TTSService()
transcriber = VoskTranscriber()


@router.websocket("/transcribe")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection accepted.")

    try:
        await transcriber.load_model()
        full_transcription = []

        while True:
            audio_chunk = await websocket.receive_bytes()
            logger.debug("Received audio chunk from client.")

            transcribed_text = await transcriber.process_audio_stream([audio_chunk])

            for text in transcribed_text:
                if text.strip():
                    await websocket.send_text(text)
                    full_transcription.append(text)
                    logger.debug(f"Transcribed text sent: {text}")

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()


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
