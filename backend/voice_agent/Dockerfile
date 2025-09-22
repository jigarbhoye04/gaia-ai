# ---- Base Stage: Contains system dependencies ----
FROM python:3.12-slim AS base
WORKDIR /app
ENV UV_HTTP_TIMEOUT=600

# Copy uv installer
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libnss3 libatk1.0-0 libx11-xcb1 libxcb-dri3-0 \
    libdrm2 libxcomposite1 libxdamage1 libxrandr2 \
    libgbm1 libasound2 curl unzip libdbus-1-3 && \
    rm -rf /var/lib/apt/lists/*

# ---- Dependency Stage: Install dependencies ----
FROM base AS dependencies
WORKDIR /app

# Copy dependency files
COPY pyproject.toml .
COPY src ./
# It's better to have a dedicated pyproject.toml for the voice agent
# Or, if you use a single one, ensure it's configured for the agent's needs.
RUN uv venv
ENV VIRTUAL_ENV=/app/.venv
ENV PATH="/app/.venv/bin:$PATH"
# Install dependencies, including ElevenLabs
RUN uv pip install --no-cache-dir \
    livekit-agents[turn-detector,silero,deepgram,elevenlabs]~=1.2 \
    livekit-plugins-noise-cancellation~=0.2 \
    python-dotenv \
    # Add any other missing dependencies here if needed
    && rm -rf /root/.cache/pip

# ---- Final Stage: Setup application for production ----
FROM dependencies AS final
WORKDIR /app

# Setup non-root user and permissions
RUN adduser --disabled-password --gecos '' appuser \
    && mkdir -p /home/appuser/.cache \
    && chown -R appuser:appuser /home/appuser

# Copy application code with proper ownership
COPY --chown=appuser:appuser . .

USER appuser

# Pre-download models/assets at build time
# Replace 'app.voice_agent' with the actual path to your main voice agent script
RUN python -m src.voice_agent download-files

# Start the agent
CMD ["python", "-m", "src.voice_agent", "dev"]