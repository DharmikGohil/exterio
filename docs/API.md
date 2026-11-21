# API Contract

Base URL: `http://localhost:8000` in development. All JSON endpoints live under `/api`.
JSON uses **camelCase**. Every endpoint except `/api/auth/*` (register, login, guest, demo-account), `/api/health-check`
and `/files/*` requires `Authorization: Bearer <accessToken>`.

Interactive docs are served at `/api/docs` (Swagger UI).

## Conventions

**Coordinates.** A `Point` is `[x, y]` in pixels of the stored project image (origin top-left).
Use `image.width` / `image.height` to map to screen space.

**Errors.** Any non-2xx response has this body:

```json
{ "status": "error", "message": "Human readable message", "code": "PROJECT_001", "details": {} }
```

`details` is optional. For a rejected photo (`IMAGE_002`, HTTP 422) it holds `{ "quality": QualityReport }`.

**Files.** `url` fields are paths such as `/files/projects/<id>/original.jpg`. Prefix them with the API base URL.
URLs change whenever the underlying file changes, so they are safe to cache.

## Types

```ts
type Point = [number, number];

type RegionLabel =
  | "wall" | "window" | "door" | "balcony" | "pillar"
  | "parapet" | "gate" | "roof_edge" | "railing";

interface User { id: string; email: string | null; name: string; isGuest: boolean }
interface AuthResponse { accessToken: string; user: User }

interface QualityIssue { code: string; severity: "error" | "warning"; message: string }
interface QualityReport {
  usable: boolean;            // false => upload was rejected
  score: number;              // 0-100
  issues: QualityIssue[];
  guidance: string[];         // plain-language tips for the user
  metrics: { width: number; height: number; blurScore: number; brightness: number };
}

interface ProjectImage { url: string; width: number; height: number; quality: QualityReport }

interface Region {
  id: string;
  label: RegionLabel;
  name: string;                       // e.g. "Wall 1"
  polygon: Point[];                   // >= 3 points
  source: "auto" | "user";
  surfaceMultiplier: number;          // default 1; e.g. 3 for a pillar with 3 exposed faces
  areaOverrideSqft: number | null;    // user-typed area, wins over the computed one
  lengthOverrideFt: number | null;    // user-typed length (railings)
}
type RegionInput = Omit<Region, "id" | "source"> & { id?: string; source?: "auto" | "user" };

type ScaleMethod = "facade_dimensions" | "reference_line" | "door_height" | "storey_height";
interface ScaleReference {
  method: ScaleMethod;
  facadeCorners: [Point, Point, Point, Point];   // TL, TR, BR, BL of the main facade plane
  referenceLine: [Point, Point] | null;          // method = reference_line
  referenceLengthFt: number | null;              // method = reference_line
  facadeWidthFt: number | null;                  // method = facade_dimensions
  facadeHeightFt: number | null;                 // method = facade_dimensions
  storeys: number;                               // method = storey_height (10 ft per storey)
  doorHeightFt: number;                          // method = door_height (default 7)
}

type MaterialCategory =
  | "paint" | "texture" | "stone" | "tile" | "panel" | "glass_railing" | "metal_railing";
interface Material {
  id: string;
  category: MaterialCategory;
  name: string;
  description: string;
  unit: "sqft" | "rft";
  colorHex: string;
  swatchUrl: string;
  materialRate: number;       // INR per unit
  labourRate: number;         // INR per unit
  wastagePct: number;
  appliesTo: RegionLabel[];
  durability: string;
  maintenance: string;
}

type RenderStatus = "none" | "pending" | "done" | "failed";
interface Design {
  id: string;
  projectId: string;
  name: string;
  assignments: Record<string, string>;   // regionId -> materialId
  previewUrl: string | null;             // instant composite
  renderUrl: string | null;              // photoreal AI render
  renderStatus: RenderStatus;
  renderError: string | null;
  updatedAt: string;
}

interface RateOverride { materialRate?: number; labourRate?: number; wastagePct?: number }

interface Project {
  id: string;
  name: string;
  image: ProjectImage | null;
  regions: Region[];
  scale: ScaleReference | null;          // null => server uses a storey-height default
  designs: Design[];
  rateOverrides: Record<string, RateOverride>;   // materialId -> override
  createdAt: string;
  updatedAt: string;
}
interface ProjectSummary {
  id: string; name: string; thumbnailUrl: string | null; designCount: number; updatedAt: string;
}

interface Estimate {
  designId: string;
  currency: "INR";
  scale: {
    method: ScaleMethod;
    feetPerPixelX: number;
    feetPerPixelY: number;
    confidencePct: number;     // +/- band applied to totals, e.g. 15
    note: string;
  };
  regions: Array<{
    regionId: string; label: RegionLabel; name: string;
    areaSqft: number; lengthFt: number; isOverride: boolean;
    materialId: string | null; materialName: string | null;
    // This part's share of its material line; 0 when it has no finish. Parts add up to the total.
    materialCost: number; labourCost: number; totalCost: number;
  }>;
  surfaces: Array<{ label: RegionLabel; count: number; areaSqft: number; lengthFt: number }>;
  lines: Array<{
    materialId: string; materialName: string; category: MaterialCategory; unit: "sqft" | "rft";
    netQuantity: number; wastagePct: number; grossQuantity: number;
    purchaseQuantity: number; purchaseUnit: string; purchaseNote: string;
    materialRate: number; labourRate: number;
    materialCost: number; labourCost: number; total: number;
  }>;
  categories: Array<{ category: MaterialCategory; materialCost: number; labourCost: number; total: number }>;
  totals: {
    materialCost: number; labourCost: number; grandTotal: number;
    lowEstimate: number; highEstimate: number;
  };
  assumptions: string[];
}

interface Capabilities {
  autoDetect: boolean;        // AI region detection configured
  photorealRender: boolean;   // AI photoreal render configured
  visionCheck: boolean;       // vision-LLM photo check configured
  advisor: boolean;           // material advisor chat configured
}
```

## Endpoints

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/health-check` | – | `{ status: "ok" }` |
| GET | `/api/system/capabilities` | – | `Capabilities` |
| POST | `/api/auth/register` | `{ email, password, name }` | `AuthResponse` |
| POST | `/api/auth/login` | `{ email, password }` | `AuthResponse` |
| POST | `/api/auth/guest` | – | `AuthResponse` |
| GET | `/api/auth/demo-account` | – | `{ email, password }` or `null` when the deployment has no demo account |
| GET | `/api/auth/me` | – | `User` |
| GET | `/api/materials` | – | `Material[]` |
| GET | `/api/projects` | – | `ProjectSummary[]` |
| POST | `/api/projects` | `{ name }` | `Project` (201) |
| POST | `/api/projects/sample` | – | `Project` (201) — ready-made demo project |
| GET | `/api/projects/{id}` | – | `Project` |
| PATCH | `/api/projects/{id}` | `{ name }` | `Project` |
| DELETE | `/api/projects/{id}` | – | 204 |
| POST | `/api/projects/{id}/image` | multipart, field `file` | `Project` — 422 `IMAGE_002` if rejected |
| POST | `/api/projects/{id}/regions/detect` | – | `Project` — replaces `auto` regions |
| PUT | `/api/projects/{id}/regions` | `{ regions: RegionInput[] }` | `Project` — full replace |
| PUT | `/api/projects/{id}/scale` | `ScaleReference` | `Project` |
| PUT | `/api/projects/{id}/rates` | `{ overrides: Record<string, RateOverride> }` | `Project` — full replace |
| POST | `/api/projects/{id}/designs` | `{ name, copyFromDesignId? }` | `Design` (201) |
| GET | `/api/designs/{id}` | – | `Design` |
| PUT | `/api/designs/{id}` | `{ name?, assignments? }` | `Design` — preview is re-rendered before returning |
| DELETE | `/api/designs/{id}` | – | 204 |
| POST | `/api/designs/{id}/render` | – | `Design` with `renderStatus: "pending"`; poll `GET /api/designs/{id}` |
| GET | `/api/designs/{id}/estimate` | – | `Estimate` |
| GET | `/api/designs/{id}/report` | – | `application/pdf` download |
| POST | `/api/advisor/chat` | `{ projectId, designId?, messages: [{ role: "user" \| "assistant", content }] }` | `{ reply: string, sources: [{ title: string }] }` |

Notes

- Replacing regions drops design assignments that point at removed region ids and re-renders previews.
- Changing regions, scale or rates never loses a design; the estimate is always computed on read.
- When a capability is `false` the matching endpoint returns 503 with code `AI_001`.
