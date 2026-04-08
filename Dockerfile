FROM node:20-slim AS frontend-build

WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./
COPY frontend/tsconfig.json frontend/tsconfig.app.json frontend/tsconfig.node.json ./
COPY frontend/vite.config.ts frontend/eslint.config.js frontend/index.html ./
COPY frontend/public ./public
COPY frontend/src ./src

RUN npm ci && npm run build


FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Copy & install Python deps first for layer caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Copy the built frontend bundle from the Node stage so FastAPI can serve it at /
COPY --from=frontend-build /frontend/dist ./frontend/dist

# Install package so [project.scripts] is callable
RUN pip install --no-cache-dir -e .

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

EXPOSE 8000

# Use the entry point declared in pyproject.toml
CMD ["python", "-m", "server.app"]
