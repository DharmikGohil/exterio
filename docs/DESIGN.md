# Design System

How the interface looks and why. The tokens live in
[`renovation-ui/tailwind.config.ts`](../renovation-ui/tailwind.config.ts); this file explains how to use them.

## Direction

| | |
|---|---|
| **Product** | Plan, picture and price an exterior renovation, for a homeowner in India |
| **Character** | Exact, grounded, a little warm |
| **World** | The drafting desk: a green cutting mat, an elevation drawing, a scale ruler |
| **Moments** | The house photo with its finishes; the estimate total on a piece of cutting mat |
| **Signature** | Measurements written the way an architect writes them: a dimension line with end ticks |

The rule behind every choice: **the content leads, the page stays quiet.** Text is dark on white,
headings are set in a heavier weight, and the work uses the full width of the screen. The
drafting-paper backdrop is felt, not seen; green is spent on the primary action, the estimate total and the sign-in story.

## Colour

| Token | Value | Use |
|---|---|---|
| `stone-50` … `stone-950` | graphite ramp | Every surface, hairline and text role. `50` page, `white` cards and panels, `100` raised and inputs, `200` hairlines, `500` muted text, `600` secondary text, `900` primary text |
| `brand-*` | mat green, `700` = `#245747` | **The one accent.** The primary action of a screen, the current step, the selection. White on `brand-700` is about 8:1 |
| `mat` / `mat-deep`, `mat-line` / `mat-ink` | green `#2b6656` / `#245747`, cream `#dfe9c6` / `#f4f6ea` | The cutting mat and its print. Only inside `MatPanel` |
| `ink` | `#10241d` | Labels, handles and chips drawn over the house photo |
| emerald, amber, red | Tailwind defaults | Meaning only: good, needs attention, error |

Rules:

- Cards, panels, tables, dialogs and inputs are white with a `stone-200` hairline.
- One accent per screen. If two things are green, one of them is wrong (the estimate total's mat is the exception it was made for).
- Materials and the photo keep their own colours; they are content, not chrome.
- No hue-to-hue gradients, glows, coloured shadows or gradient text.

## The page and the frame

- **Backdrop** (`PageBackdrop`): drafting paper, `stone-50` with a 12px grid and a heavier line
  every 60px, drawn at 2.5% and 5.5% ink. It is texture, not a pattern; if it is the first thing you
  notice, it is too strong. It is fixed while the page scrolls. There are no edge rulers or
  printed numbers: they caught the eye before the work did.
- **Header** (`AppHeader`): the logo and the user menu on the page, 56px tall, in the frame.
- **Frame** (`utils/pageFrame`): full window width, with 16 / 32 / 40px side padding as the screen
  grows. Nothing is capped at a max width, so the photo, panels and tables use all the room there
  is. The studio's pinned step bar uses `PAGE_FRAME_BLEED` to run edge to edge.

| Layout | What it shows |
|---|---|
| `AppLayout` | The header, then the routed page in the frame |
| `AuthLayout` | A split screen: the product story on the cutting mat fills the left half edge to edge, the sign-in form sits on plain white in the right half (phones get the form only). It fits one screen from 1280×760 up |
| `CenteredLayout` | One card in the middle, for single-message pages like the 404 |

## The cutting mat

`MatPanel` is the product's material, used in two places only:

1. **The estimate total** (`GrandTotalCard`): the moment where the house becomes a price.
2. **The sign-in story** (`LoginPage`): the left half of the sign-in screen, the headline with the
   elevation drawing lying on the mat as a sheet of paper.

It draws mat green, a 12px cream grid with a heavier line every 60px, and the 30°, 45° and 60°
guides (`MatAngleGuides`) real mats print in one corner. It is never a page background: a
coloured, gridded page pulls the eye away from the text.

## Signature: dimension lines

Wherever the interface states a measured or estimated quantity, it can draw it as a dimension line:

- `DimensionLine` (HTML) for figures in panels, like the estimate's likely range.
- `SvgDimension` (SVG) on the photo, like the wall width and height in the Scale step, drawn
  outside the wall with extension lines, end ticks and the figure set into the middle.

## Type

| Use | Family | Size / weight |
|---|---|---|
| Interface | Nohemi | 15px body, 400; labels and buttons 500 |
| Figures, units, meta | IBM Plex Mono | 11–12px; every number uses tabular figures |
| Page titles | Nohemi | 34px, 500, −0.01em |
| Step titles | Nohemi | 30px, 500, −0.01em |
| Panel and section titles | Nohemi | 15–18px, 500 |
| Hero headline (sign-in) | Nohemi | 46px, 500 |
| Big figure (estimate total) | Nohemi | 40px, 400 |

Nohemi (Befonts, commercial use allowed; licence in `renovation-ui/public/fonts`) ships in two
weights, Regular and Medium. `font-semibold` and `font-bold` map to Medium rather than a faked
bold. Sentence case everywhere, no uppercase tracked labels, no italic for emphasis.

## Shape, spacing and depth

- Spacing sits on a 4px grid. Navigation rows 32–36px, list rows 36px, page padding 32px.
- Radius: tags 4px, controls 8px, cards and panels 12px. Inner radius = outer radius − padding.
- Depth comes from hairlines (`stone-200`), not shadows. Floating things (menus, the advisor
  panel, the photo-check checklist) use one soft neutral shadow.

## Icons

lucide, through the `Icon` atom only. 16px, stroke 1.5, in the text colour of their role.
No sparkle or wand icons; each icon says what its button does.

## Motion

- One easing curve, `cubic-bezier(0.22, 1, 0.36, 1)`; 160ms for hover and press, 300ms for entrances.
- Transition colour, background, border, opacity and transform only. Buttons press to 0.98.
- Loading uses a left-to-right sheen (`Skeleton`, `ShimmerOverlay`), never a pulse.
- Nothing loops unless it is live (a check or detection that is actually running).
- `prefers-reduced-motion` turns animation off.

## Component map

| Component | Where | Role |
|---|---|---|
| `MatAngleGuides` | `shared/atoms` | The 30°, 45° and 60° guides in a mat's corner |
| `MatPanel` | `shared/molecules` | A piece of cutting mat, for the estimate total and the sign-in story |
| `AppLayout`, `AuthLayout`, `CenteredLayout` | `shared/layouts` | How each kind of page is laid out |
| `PAGE_FRAME`, `PAGE_FRAME_BLEED` | `shared/utils/pageFrame` | The full-width frame shared by the app bar, pages and the step bar |
| `AppHeader` | `shared/organisms` | The logo and user menu above the page |
| `PageBackdrop` | `shared/organisms` | The quiet drafting-paper grid behind every page |
| `DimensionLine` | `shared/molecules` | A figure written as a dimension, light or mat tone |
| `SvgDimension` | `shared/molecules` | A dimension line drawn on the photo |
| `RegionNameTag` | `shared/molecules` | Region name pinned on the photo; layout in `utils/nameTagLayout` |
| `Skeleton`, `ShimmerOverlay` | `shared` | Loading states |
| `StepFooter` | `features/studio` | The step bar pinned to the bottom of the studio |
| `Logo` | `shared/atoms` | Wordmark and a flat gable-and-dimension mark |

The redesign followed the *unslop* method by Damir Sokolovsky
([@heydamir](https://x.com/heydamir), CC BY 4.0): audit, a written direction, then passes for
spacing, colour, icons, copy, type, layout, details, visuals and motion.
