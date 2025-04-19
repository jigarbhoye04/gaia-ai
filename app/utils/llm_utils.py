import httpx


GROQ_MODEL = "meta-llama/Llama-4-Maverick-17B-128E-Instruct"

http_async_client = httpx.AsyncClient(timeout=1000000)
http_sync_client = httpx.Client(timeout=1000000)


async def do_prompt_no_stream(
    prompt: str,
    system_prompt: str,
    temperature: float = 0.6,
    max_tokens: int = 1024,
    model: str = "@cf/meta/llama-3.1-8b-instruct-fast",
):
    """Send a prompt to the LLM API without streaming. Try Groq first, fall back to original LLM."""
    # messages = [{"role": "user", "content": prompt}]
    # groq_messages = prepare_messages(messages, system_prompt)

    # try:
    #     return await call_groq_api(groq_messages, temperature, max_tokens)
    # except Exception as e:
    #     logger.warning(f"Groq API error, falling back: {e}")

    # # Use processed messages for consistency with Groq
    # processed_messages = prepare_messages(messages, system_prompt)
    # return await make_llm_request(
    #     {
    #         "stream": "false",
    #         "temperature": temperature,
    #         "max_tokens": max_tokens,
    #         "model": model,
    #         "messages": processed_messages,
    #     },
    #     http_async_client,
    # )
