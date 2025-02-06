# Use a smaller base image (reduces image size)
FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app

# Install dependencies (wget for uv installation & cleanup)
RUN apt-get update && apt-get install -y --no-install-recommends wget && \
    rm -rf /var/lib/apt/lists/*

# Install UV using wget (faster & avoids extra dependencies)
RUN wget -qO- https://astral.sh/uv/install.sh | sh

# Ensure UV is available in the PATH
ENV PATH="/root/.local/bin/:$PATH"

# Copy the pyproject.toml file first to leverage Docker caching
COPY pyproject.toml ./

# Install dependencies using UV
RUN uv sync

RUN uv pip install nltk

# Download necessary NLTK data in a single step to optimize caching
# RUN python -m nltk.downloader punkt stopwords punkt_tab
RUN uv run python -m nltk.downloader punkt stopwords punkt_tab


# Copy the rest of the application code into the container
COPY . .

# **Change the working directory to /app/app**
WORKDIR /app/app

# Expose the application port
EXPOSE 8000

# Command to run the FastAPI app with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
