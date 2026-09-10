#!/usr/bin/env bash
# Railway / container entrypoint: migrate then serve.
# Do not echo DATABASE_URL, tokens, or other secrets.
set -euo pipefail

cd "$(dirname "$0")"

PORT="${PORT:-8000}"

echo "Running Alembic migrations (alembic upgrade head)..."
alembic upgrade head

echo "Starting uvicorn on 0.0.0.0:${PORT}"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
