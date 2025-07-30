import asyncio

from app.config.loggers import audio_logger as logger
from app.config.settings import settings
from app.models.audio_models import TTSRequest
from app.services.audio_service import TTSService
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()
tts_service = TTSService()

DEEPGRAM_API_KEY = settings.DEEPGRAM_API_KEY


class DeepgramTranscriber:
    def __init__(self, result_callback):
        self.result_callback = result_callback
        self.dg_connection = None

    def start(self):
        from deepgram import DeepgramClient, LiveOptions, LiveTranscriptionEvents

        logger.info("Initializing Deepgram client.")
        deepgram = DeepgramClient(DEEPGRAM_API_KEY)
        self.dg_connection = deepgram.listen.websocket.v("1")
        logger.info("Deepgram WebSocket connection object created.")

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

    def send_audio(self, data):
        if self.dg_connection:
            self.dg_connection.send(data)

    def stop(self):
        if self.dg_connection:
            self.dg_connection.close()


@router.post("/synthesize", responses={200: {"content": {"audio/wav": {}}}})
async def synthesize(request: TTSRequest):
    return await tts_service.synthesize_speech(request.text)


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
