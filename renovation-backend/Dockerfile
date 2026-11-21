FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_HTTP_TIMEOUT=180

COPY --from=ghcr.io/astral-sh/uv:0.13 /uv /usr/local/bin/uv

WORKDIR /app

# Dependencies first, so code changes do not invalidate this layer.
COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --frozen --no-dev --no-install-project

COPY src ./src

RUN useradd --create-home appuser && mkdir -p /app/data && chown -R appuser /app/data
USER appuser

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH=/app/src \
    APP_ENV=production \
    DATABASE_URL=sqlite:////app/data/app.db \
    STORAGE_DIR=/app/data/files \
    PORT=8000

EXPOSE 8000
CMD ["sh", "-c", "uvicorn bootstrap.server:app --host 0.0.0.0 --port ${PORT}"]
