# Exterio UI

Web client for the exterior house renovation and cost estimation API. A homeowner uploads a
photo of their house, corrects the detected parts (walls, windows, pillars...), sets a
real-world scale, applies finishes, and gets quantities, a cost estimate in INR and a PDF report.

Vite, React 18, TypeScript (strict), Tailwind CSS, TanStack Query, React Router.

## Getting started

```bash
cp .env.example .env     # point VITE_API_BASE_URL at the API
npm install
npm run dev              # http://localhost:5173
```

| Script                 | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Vite dev server                               |
| `npm run typecheck`    | `tsc -b`, no emit                             |
| `npm run lint`         | ESLint, zero warnings allowed                 |
| `npm run test`         | Vitest in watch mode                          |
| `npm run test:ci`      | Vitest, single run (used in CI)               |
| `npm run build`        | Typecheck, then production build into `dist/` |
| `npm run preview`      | Serve the production build locally            |
| `npm run format`       | Prettier, write                               |
| `npm run format:check` | Prettier, check only                          |

## Environment

| Variable            | Default                 | Purpose                                 |
| ------------------- | ----------------------- | --------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL of the API, no trailing slash. |

File paths returned by the API (`/files/...`) are prefixed with the same base URL. The API must
allow this app's origin through CORS, including the `Authorization` header.

`vercel.json` rewrites every path to `/index.html`, so deep links such as
`/projects/<id>?step=design` work on Vercel.

## Structure

Clean Architecture, with Atomic Design in the presentation layer. Dependencies point inwards:
`domain` knows nothing, `application` knows `domain`, `infrastructure` and `presentation` sit
on the outside.

```
src/
  config/                          app name, API base URL, tunables
  domain/
    models/<feature>/              types from the API contract (auth, project, material,
                                   design, estimate, system, advisor)
    interfaces/<feature>/          I<Feature>Service, I<Feature>Repository
    utils/                         pure functions shared by layers
  application/
    features/<feature>/            <Feature>Service: validation and orchestration (+ errors)
    shared/errors.ts               AppError and friends; `message` is always user-safe
  infrastructure/
    api/BaseRepository.ts          error mapping (ApiError -> application errors)
    api/<feature>/                 <Feature>Repository: the actual endpoints
    utils/http/                    IHttpClient, FetchHttpClient, ApiError, token storage
  presentation/
    routes/                        router and route paths
    shared/
      atoms/                       Button, Input, Label, Select, Card, Badge, Spinner, Icon,
                                   Tabs, Dialog, Tooltip, Alert, Skeleton, ColorDot
      molecules/                   FormField, ConfirmDialog, ImageCanvas, SvgDragHandle, ...
      organisms/ layouts/          AppHeader, Toaster / AppLayout, AuthLayout
      contexts/ providers/         HTTP client, toasts / AppProviders, QueryProvider
      hooks/ guards/ utils/        cross-feature hooks, route guards, cn(), formatters
    features/<feature>/
      contexts/                    composition root: repository -> service, exposed by context
      hooks/                       React Query hooks and UI-state hooks, one concern each
      pages/ organisms/ molecules/ utils/
```

Presentation features: `auth`, `projects`, `studio` (photo, regions and scale steps),
`design`, `materials`, `estimate`, `advisor`, `system` (server capabilities).

## The data-flow rule

```
Component -> Hook -> Service (from React Context) -> Repository -> IHttpClient
```

- Components and pages are mostly JSX. They call hooks and never touch `fetch`, a repository or
  a service class.
- Hooks get their service from the feature context and wrap it in `useQuery` / `useMutation`
  with query-key constants. Mutations write the server response into the cache or invalidate
  what they made stale.
- Services depend on repository interfaces (constructor injection) and hold the validation.
- Repositories extend `BaseRepository`, which turns transport failures into application errors.
  `FetchHttpClient` is the only place that calls `fetch`.
- Each feature's `contexts/<Feature>Context.tsx` is the only place a repository or service is
  instantiated.

ESLint enforces the edges of this: `fetch` is banned outside `infrastructure/utils/http`,
`lucide-react` is banned outside the `Icon` atom, and pages, organisms, molecules, atoms and
layouts may not import from `infrastructure/` or `application/`.

## Tests

Tests sit next to the code they cover, in `__tests__` folders, and run on Vitest with jsdom and
Testing Library (`vitest.config.ts`, setup in `src/test/setup.ts`).

- **Domain and application:** business rules and services, with repositories mocked through
  their interfaces.
- **Utilities:** pure functions in `shared/utils` and `features/*/utils`.
- **Components:** rendered with Testing Library and driven with `userEvent`; tests assert what a
  user sees and can do, not implementation details.

## Design

The visual rules (tokens, the Nohemi type scale, the quiet drafting-paper page, the full-width frame, the cutting-mat moments and dimension lines) are in
[`../docs/DESIGN.md`](../docs/DESIGN.md).

## Things worth knowing

- **Server state** lives in React Query. The project detail query is the single source of truth
  for a project and its designs; mutations patch it instead of refetching.
- **Session**: the access token is kept in `localStorage`. Any `401` ends the session and the
  auth guard sends the user to `/login`.
- **Canvases** are SVGs whose `viewBox` equals the image size, so polygons are stored and drawn
  in image pixels. Pointer positions are converted with `svg.getScreenCTM().inverse()`
  (`useSvgCanvas`), which stays correct under any scaling, and dragging uses pointer capture so
  it works with touch.
- **Unsaved edits** in the Regions and Scale steps are local until saved. Leaving the step, the
  page or the tab asks for confirmation (`useUnsavedChangesGuard`).
- **Full-replace endpoints** (design assignments, rates, area overrides) are updated
  optimistically and saved one at a time, so quick successive edits build on each other.
- **Optional AI features** follow `GET /api/system/capabilities`: auto-detect and photoreal
  render are disabled with an explanation, and the advisor is hidden, when not configured.
