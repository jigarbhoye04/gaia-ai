# ---- Base Image: Contains heavy dependencies  ----
FROM aryanranderiya/gaia-base:latest

# Set environment variables
ENV ENV=production \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_SYSTEM_PYTHON=1 \
    UV_LOGGING=1

WORKDIR /app

# Install dependencies with uv
COPY pyproject.toml ./
RUN --mount=type=cache,target=/root/.cache/uv \
  if [ "$ENV" = "production" ]; then \
    uv pip install --no-cache-dir --group core ; \
  else \
    uv pip install --no-cache-dir --group core --editable . ; \
  fi

# Setup non-root user, cache directories, and permissions in one step
RUN adduser --disabled-password --gecos '' appuser \
    && mkdir -p /home/appuser/.cache/huggingface /home/appuser/nltk_data /home/appuser/.cache/ms-playwright \
    && cp -R /root/nltk_data/* /home/appuser/nltk_data/ \
    && chown -R appuser:appuser /home/appuser
    # && cp -R /root/.cache/ms-playwright/* /home/appuser/.cache/ms-playwright/ \

# Copy application code with proper ownership
COPY --chown=appuser:appuser . .

USER appuser
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]