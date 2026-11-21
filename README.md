# Exterio — AI Exterior House Renovation & Cost Estimation

Upload a photo of a house, mark or auto-detect its walls, pillars, railings and openings, apply
materials to each part, see the house redesigned, and get areas, material quantities and a
transparent cost breakdown as a PDF to take to a contractor.

Built as a pre-construction planning assistant for homeowners in India: square feet, running feet
and INR throughout.

## What it does

| Requirement | Where to see it |
|---|---|
| Upload a photo, reject unusable ones with guidance | Step 1 — sharpness, brightness and resolution checks, plus an optional vision-model check |
| Identify walls, windows, balconies, pillars, parapets, gates, roof edges | Step 2 — AI detection (segmentation model or vision LLM), returned as editable polygons |
| Review and correct detected regions | Step 2 — reshape, relabel, add, delete, or draw from scratch |
| Material catalogue, different materials on different parts | Step 4 — 20 materials across paint, texture, stone, tile, panels and railings |
| Multiple combinations, switching between designs | Step 4 — any number of named designs per project, with a cost comparison |
| Redesigned image that keeps the building's structure | Step 4 — instant composite, and an AI photoreal render with before/after slider |
| Surface area per building part | Step 5 — perspective-corrected areas with a stated confidence band |
| Quantities with wastage and coverage | Step 5 — litres of paint, tiles, sheets, sq ft of stone, running ft of railing |
| Material, labour, per-category and grand total; editable rates | Step 5 — change a rate or wastage and the totals recalculate |
| Downloadable report | Step 5 — PDF with both images, materials, quantities, costs and assumptions |
| Save and re-edit projects, multiple users | Accounts, a published demo account (or one-click guest access); every change is persisted |

## Documentation

| Document | Contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, layering rules, AI provider layer, data model |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | The user journey, step by step |
| [docs/ESTIMATION.md](docs/ESTIMATION.md) | Every formula from pixels to rupees, with measured accuracy |
| [docs/LIMITATIONS.md](docs/LIMITATIONS.md) | What the numbers can and cannot be trusted for |
| [docs/API.md](docs/API.md) | REST contract |
| [docs/DESIGN.md](docs/DESIGN.md) | Design system: direction, tokens, the cutting mat and the dimension-line signature |

## The core idea

Everything is derived from one list of labelled region polygons. The redesigned image and the cost
estimate are both computed from those regions, so they cannot drift apart, and a user who fixes a
region fixes both at once.

Rendering is two-tier. Trying a material is an instant, free composite done with OpenCV. The
slower, paid AI render is an explicit action; it starts from that composite, is asked only to add
realism, and has the original pixels pasted back outside the edited regions, so the building's
structure is preserved by construction.

## Repository layout

```
exterio-backend/   Python 3.12, FastAPI — API, measurement, costing, PDF
exterio-frontend/  React, TypeScript, Vite — the five-step studio
exterio-render/    Photoreal renderer on Modal — SDXL + ControlNet on a GPU
docs/                 Architecture, workflow, estimation, limitations, API
```

Both follow the same layered architecture (`domain` → `infrastructure` → `presentation`), described
in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The backend's layer rules are enforced by
`import-linter` in CI.

## Run it locally

Requirements: [uv](https://docs.astral.sh/uv/) and Node 22 or newer.

```bash
cd exterio-backend && cp .env.example .env && uv sync && make dev
```

```bash
cd exterio-frontend && cp .env.example .env && npm install && npm run dev
```

Open http://localhost:5173 and press **Sign in with the demo account** (`demo@example.com` /
`review-2026` by default, set with `DEMO_ACCOUNT_EMAIL` and `DEMO_ACCOUNT_PASSWORD`). It already
holds a finished sample house.
API docs are at http://localhost:8000/api/docs.

No API keys are needed to run the full flow. Adding them switches on the AI features:

| Variable (in `exterio-backend/.env`) | Enables |
|---|---|
| `MODAL_RENDER_URL`, `MODAL_RENDER_TOKEN` | The photoreal render on Exterio's own SDXL renderer on Modal (see [`exterio-render/`](exterio-render/README.md)). Preferred over fal.ai when set |
| `FAL_KEY` | Automatic region detection, and the photoreal render when Modal is not set. Without it the Design step simply shows no render button or render tab; the instant preview covers every finish |
| `ANTHROPIC_API_KEY` | Vision check on uploaded photos, the material advisor, and region detection when `FAL_KEY` is not set |
| `ANTHROPIC_GATEWAY_URL` | Optional Anthropic-compatible endpoint to use instead of Anthropic's API |

## Quality checks

```bash
cd exterio-backend && make check
```

This runs the formatter and linter (ruff), strict type checking (mypy), the architecture boundary
check (import-linter) and the tests (pytest).

```bash
cd exterio-frontend && npm run typecheck && npm run lint && npm run test:ci && npm run build
```

The frontend tests (Vitest and Testing Library) cover the domain rules for a valid scale, the
auth service against a mocked repository, the shared formatting, geometry and name-tag layout
utilities, region drafts, step navigation, and the step bar and dimension-line components.

The backend tests include:

- the estimation maths against hand calculations,
- the perspective geometry against a simulated pinhole camera with known ground truth,
- area accuracy on a synthetic house whose every dimension is known,
- the full HTTP flow, including ownership, validation and error mapping, with fake AI providers.

## Deployment

- **API:** build `exterio-backend/Dockerfile`. Set `JWT_SECRET`, `CORS_ORIGINS` and the optional
  AI keys, and mount a persistent volume at `/app/data`. Set `DATABASE_URL` to use Postgres instead
  of SQLite.
- **Web:** deploy `exterio-frontend` as a static site (a `vercel.json` is included) with
  `VITE_API_BASE_URL` set to the API's public URL.

## Scope and assumptions

- Low-rise residential buildings, exterior only.
- One photo is one elevation. Hidden sides are not estimated.
- Estimates are advisory, not quotations. Default rates are indicative 2026 figures for India and
  are meant to be edited; see [docs/ESTIMATION.md](docs/ESTIMATION.md) for sources.

## How AI tools were used

This project was built with an AI coding assistant, as the brief allowed. The architecture, the
choice to derive image and estimate from one set of regions, the perspective and scale method, and
the trade-offs in [docs/LIMITATIONS.md](docs/LIMITATIONS.md) are documented so that every part can
be explained and defended.
