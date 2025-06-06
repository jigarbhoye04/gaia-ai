import asyncio
import json
import signal

from aio_pika import connect_robust
from aio_pika.abc import AbstractIncomingMessage
from aiolimiter import AsyncLimiter

from app.config.loggers import worker_logger as logger
from app.config.settings import settings

# TODO: Analyze the rate limit and adjust based on actual LLM performance
llm_limiter = AsyncLimiter(10, 1)  # 10 tasks per second

stop_event = asyncio.Event()


async def on_message(message: AbstractIncomingMessage):
    from app.worker_node.process_email import process_emails

    async with message.process():
        async with llm_limiter:
            try:
                data = json.loads(message.body.decode())
                await process_emails(
                    history_id=data.get("history_id"), email=data.get("email_address")
                )
            except Exception as e:
                logger.error(f"Failed to process message: {e}")


async def shutdown(signal_name):
    logger.info(f"Received exit signal {signal_name}. Shutting down...")
    stop_event.set()


async def start_worker(queue_name="email-events"):
    from app.langchain.core.graph_builder import build_mail_processing_graph
    from app.langchain.core.graph_manager import GraphManager

    connection = await connect_robust(settings.RABBITMQ_URL, timeout=10)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=10)

    queue = await channel.declare_queue(queue_name, durable=True)
    await queue.consume(on_message)

    # Build the processing graph
    async with build_mail_processing_graph() as built_graph:
        GraphManager.set_graph(built_graph, graph_name="mail_processing")

    logger.info(f"Worker started on queue: {queue_name}")

    # Handle shutdown signals
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(
            sig, lambda s=sig: asyncio.create_task(shutdown(s.name))
        )

    await stop_event.wait()

    logger.info("Closing connection...")
    await connection.close()


if __name__ == "__main__":
    try:
        asyncio.run(start_worker())
    except Exception as e:
        logger.error(f"Worker encountered an error: {e}", exc_info=True)
