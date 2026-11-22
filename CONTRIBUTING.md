# Contributing to Exterio

Thanks for taking the time to improve Exterio. This guide covers how the code is organised, how to
run it, and what every change is expected to include.

## Set up

Follow [Quick start](README.md#quick-start) to run the API on port 8000 and the web app on port
5173. No API keys are needed for the core flow; see [Configuration](README.md#configuration) to
switch on the AI features.

## How the code is organised

Both apps use the same layered architecture. Dependencies point inwards only:

| Layer | Backend (`exterio-backend/src`) | Web app (`exterio-frontend/src`) |
|---|---|---|
| Domain | Entities, use cases, interfaces, prompts. No frameworks, no I/O | Models, interfaces, pure rules |
| Infrastructure | Database, storage, imaging, AI providers, reports | HTTP client, repositories, browser utilities |
| Application | (use cases live in the domain) | Services: validation and orchestration |
| Presentation | Routes, controllers, schemas | Components, hooks, pages |

- The backend's boundaries are enforced by `import-linter` (in `make check` and CI): the domain
  must not import FastAPI, SQLAlchemy, OpenCV, an AI SDK or any other framework.
- In the web app, components call hooks, hooks call services, services call repositories.
  Component files export components only; shared constants and helpers live in `utils/`.
- An AI provider always sits behind a domain interface with a fake in the tests, and is chosen in
  `infrastructure/registry.py`.

## Every change includes

- **Tests.** New behaviour comes with tests next to the code (`__tests__/`). Bugs get a test that
  fails without the fix.
- **Docs.** If a change affects what a user sees, how a number is computed or what a setting does,
  update the matching file in [`docs/`](docs) and the README in the same change.
- **Green checks.** Both must pass before you commit:

  ```bash
  cd exterio-backend && make check
  ```

  ```bash
  cd exterio-frontend && npm run typecheck && npm run lint && npm run test:ci && npm run build
  ```

## Commits

- One logical change per commit, with its tests and docs.
- A short subject in the imperative mood that says what changes for the user or the code, for
  example `Stream Auto-detect: draw each part while the AI is still finding them`.
- A body that says **why**, and any numbers that informed the decision (a benchmark, a timing).
- Never commit secrets. `.env` files are git-ignored; keys go in the host's secret settings.

## Common tasks

**Add a material.** Add it to
`exterio-backend/src/infrastructure/repository/catalog/materials.json` with its category, unit,
coverage, wastage, rates and the parts it applies to. Its swatch is generated at start-up from the
same texture the preview uses. Re-run `make check`.

**Add or swap an AI provider.** Implement the domain interface (for example
`ISegmentationService` or `IPhotorealRenderService`) in `infrastructure/services/ai/`, add a
fake-backed test, wire it in `infrastructure/registry.py` and document the choice in
`docs/ARCHITECTURE.md`. For detection, measure it first with `scripts/benchmark_detection.py`.

**Change a sample house or the renderer.** Edit
`sample_houses/<name>/house.json`, then regenerate the sign-in images with
`uv run python scripts/render_showcase.py` and check each render by eye.

## Reporting a problem

Open an issue with what you did, what you expected and what happened instead. For an estimate that
looks wrong, include the photo (or the project's region and scale settings) and the rates used.
