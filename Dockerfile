# # Use an official Python image as the base
# FROM python:3.12

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

# Copy dependencies file first (leveraging Docker caching)
COPY requirements.txt .

# Install dependencies using UV (faster than pip)
RUN uv pip install -r requirements.txt --system

# Download necessary NLTK data in a single step to optimize caching
RUN python -m nltk.downloader punkt stopwords punkt_tab

# Copy the rest of the application code into the container
# The . (source) refers to your local directory.
# # The second . (destination) refers to the container's working directory /app.
COPY . .

# **Change the working directory to /app/app**
WORKDIR /app/app

# Expose the application port
EXPOSE 8000

# Command to run the FastAPI app with Uvicorn
# Uses `--host 0.0.0.0` to allow access from outside the container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# # Build the Docker container, DOT . is the current directory
# # docker build -t gaia .

# # Run the Docker Container from the image, -p : specify port
# # docker run -p 8000:8000 gaia
