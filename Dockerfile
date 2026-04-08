FROM python:3.11-slim

WORKDIR /app

# System deps + Node.js for frontend build
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends \
        nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy & install Python deps first for layer caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Build the copied React frontend so FastAPI can serve it at /
RUN cd frontend && npm ci && npm run build

# Install package so [project.scripts] is callable
RUN pip install --no-cache-dir -e .

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

EXPOSE 8000

# Use the entry point declared in pyproject.toml
CMD ["python", "-m", "server.app"]
