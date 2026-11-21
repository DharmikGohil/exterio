.PHONY: install dev test lint typecheck boundaries check

install:
	uv sync

dev:
	uv run uvicorn bootstrap.server:app --app-dir src --reload --port 8000

test:
	uv run pytest

lint:
	uv run ruff format --check src tests
	uv run ruff check src tests

typecheck:
	uv run mypy src

boundaries:
	cd src && uv run lint-imports --config ../pyproject.toml

check: lint typecheck boundaries test
