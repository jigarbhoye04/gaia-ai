# # ---- Base Stage: Setup Python & Install Dependencies ----
# FROM aryanranderiya/gaia-base:latest AS base

# ARG ENV=production
# ENV ENV=${ENV} \
#     UV_COMPILE_BYTECODE=1 \
#     UV_LINK_MODE=copy \
#     UV_SYSTEM_PYTHON=1

# # Copy dependency manifest and install Python dependencies via UV
# COPY pyproject.toml ./
# RUN --mount=type=cache,target=/root/.cache/uv \
#     if [ "$ENV" = "production" ]; then \
#       uv sync --no-cache --group core ; \
#     else \
#       uv sync --no-cache --group core --editable . ; \
#     fi

# # ---- Final Stage: Build Minimal Runtime Image ----
# FROM base AS final

# # Set up user, directories, ownerships, and cleanup in one go
# RUN adduser --disabled-password --gecos '' appuser && \
#     mkdir -p /home/appuser/.cache/huggingface /home/appuser/nltk_data /home/appuser/.cache/ms-playwright && \
#     chown -R appuser:appuser /home/appuser && \
#     rm -rf /tmp/*

# # Copy app and required data with correct ownership
# COPY --chown=appuser:appuser . .
# COPY --from=base /root/nltk_data /home/appuser/nltk_data
# COPY --from=base /root/.cache/ms-playwright /home/appuser/.cache/ms-playwright

# # Expose ports and switch to non-root
# EXPOSE 8000
# USER appuser

# # Start the FastAPI application
# CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# ---- Base Image: Contains heavy dependencies like playwright, nltk, tesseract, etc. ----
FROM aryanranderiya/gaia-base:latest

# Set environment variables
ENV ENV=production \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_SYSTEM_PYTHON=1 \
    UV_LOGGING=1

WORKDIR /app

# Copy pyproject.toml and install dependencies
COPY pyproject.toml ./

# Install dependencies with uv
RUN --mount=type=cache,target=/root/.cache/uv \
  if [ "$ENV" = "production" ]; then \
    uv pip install --no-cache-dir --group core ; \
  else \
    uv pip install --no-cache-dir --group core --editable . ; \
  fi

# Setup non-root user and directories
RUN adduser --disabled-password --gecos '' appuser && \
    mkdir -p /home/appuser/.cache/huggingface /home/appuser/nltk_data /home/appuser/.cache/ms-playwright && \
    chown -R appuser:appuser /home/appuser

# Copy application code with proper ownership
COPY --chown=appuser:appuser . .

# Setup cache directories for the appuser
RUN cp -r /root/nltk_data/* /home/appuser/nltk_data/ && \
    cp -r /root/.cache/ms-playwright/* /home/appuser/.cache/ms-playwright/ && \
    chown -R appuser:appuser /home/appuser

USER appuser
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]