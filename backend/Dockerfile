# Use the official, lightweight Python 3.12 image
FROM python:3.12-slim

# Prevent Python from buffering stdout/stderr (so we see logs instantly)
ENV PYTHONUNBUFFERED=1

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file first to leverage Docker layer caching
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend source code into the container
COPY . .

# Run the ingestion service when the container launches
CMD ["python", "ingestion_service.py"]