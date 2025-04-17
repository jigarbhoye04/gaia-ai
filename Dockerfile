# ---- Base Stage: Setup Python & Install Dependencies ----
FROM aryanranderiya/gaia-base:latest AS base

ARG ENV=production
ENV ENV=${ENV} \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_SYSTEM_PYTHON=1

WORKDIR /app

# Copy dependency manifest and install Python dependencies via UV
COPY pyproject.toml ./
RUN --mount=type=cache,target=/root/.cache/uv \
    if [ "$ENV" = "production" ]; then \
      uv sync --no-cache --group core ; \
    else \
      uv sync --no-cache --group core --editable . ; \
    fi

# ---- Final Stage: Build Minimal Runtime Image ----
FROM base AS final

# Set up user, directories, ownerships, and cleanup in one go
RUN adduser --disabled-password --gecos '' appuser && \
    mkdir -p /home/appuser/.cache/huggingface /home/appuser/nltk_data /home/appuser/.cache/ms-playwright && \
    chown -R appuser:appuser /home/appuser && \
    rm -rf /tmp/*

WORKDIR /app

# Copy app and required data with correct ownership
COPY --chown=appuser:appuser . .
COPY --from=base /root/nltk_data /home/appuser/nltk_data
COPY --from=base /root/.cache/ms-playwright /home/appuser/.cache/ms-playwright

# Expose ports and switch to non-root
EXPOSE 8000
USER appuser

# Start the FastAPI application
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
