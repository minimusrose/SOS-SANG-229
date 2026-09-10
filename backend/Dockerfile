# SOS Sang 229 — FastAPI image for Railway (and local docker).
# Build context must be this directory (backend/).
# Railway: set Root Directory = backend, or the build context will be wrong.
FROM python:3.12-slim-bookworm

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app
COPY scripts ./scripts
COPY start.sh ./start.sh

RUN chmod +x start.sh

# Railway injects PORT. /health does not need the database.
EXPOSE 8000

CMD ["./start.sh"]
