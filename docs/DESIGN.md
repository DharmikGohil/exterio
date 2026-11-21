# Design System

How the interface looks and why. The tokens live in
[`exterio-frontend/tailwind.config.ts`](../exterio-frontend/tailwind.config.ts); this file explains how to use them.

## Direction

| | |
|---|---|
| **Product** | Plan, picture and price an exterior renovation, for a homeowner in India |
| **Character** | Exact, grounded, a little warm |
| **World** | The drafting desk: a green cutting mat, an elevation drawing, a scale ruler |
| **Moments** | The house photo with its finishes; the estimate drawn on the house, part by part |
| **Signature** | Measurements written the way an architect writes them: a dimension line with end ticks |

The rule behind every choice: **the content leads, the page stays quiet.** Text is dark on white,
headings are set in a heavier weight, and the work uses the full width of the screen. The
drafting-paper backdrop is felt, not seen; green is spent on the primary action, the current step and the sign-in story.

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
- One accent per screen. If two things are green, one of them is wrong.
- Materials and the photo keep their own colours; they are content, not chrome.
- No hue-to-hue gradients, glows, coloured shadows or gradient text.

## The page and the frame

- **Backdrop** (`PageBackdrop`): drafting paper, `stone-50` with one 60px grid drawn at 3.5% ink.
  There are no fine lines; they made the page busier than the work on it. It is texture, not a pattern; if it is the first thing you
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

## The studio: tools live on the photo

Every studio step has the same shape: a big title with one line of description, the photo on the
left with its tools floating on it, a panel on the right, and the step bar pinned at the bottom.
Everything is in view without scrolling on screens from 1280×720 up.

- **Header**: the studio puts its breadcrumb and stepper into the app header through a header slot
  (`HeaderSlot`, a portal), so there is no second bar. The stepper (`StudioStepper`) is plain text:
  done steps carry a check, the current step is a green pill with its number, upcoming steps show
  their number. Projects are renamed only on the home screen (the pencil on each project card).
- **Material advisor**: "Ask about materials" sits in the step header (Photo, Regions, Estimate)
  or in the panel header (Design). Its chat panel is mounted once for the studio
  (`AdvisorDockProvider`), so the conversation survives moving between steps.
- **Tools float on the photo** (white cards with one soft shadow):
  - top left, the step's own tools: Draw region and Auto-detect (Regions); Design or Before / after
    and Preview or Photoreal (Design);
  - top right, the names toggle, an eye button (`NameTagToggle`);
  - top centre, a short hint or progress note (drawing help, "Updating preview…");
  - bottom centre, the one action the photo is waiting for: the unsaved-changes bar with Discard
    and Save regions (`FloatingSaveBar`, Regions, shown only when something changed) or Generate
    render (Design); on Scale, the instruction to drag the corners sits bottom left.
- **Design picker** (`DesignSwitcher`): the current design in a dark dropdown listing all designs,
  a "⋯" menu (`DropdownMenu`) to rename, duplicate or delete it, and New design.
- **Scale saves itself**: a segmented control picks how the size is known (Wall size, One length,
  Door, Floors); a valid change is saved 0.7 s after typing pauses, and a line under the inputs says
  "Saving…" or "Scale saves automatically. Estimates use it." Leaving the step sends a pending
  change at once; it only asks before leaving when the values are invalid and cannot be saved.
- **Panels**: the title with its count ("Regions · 14"), groups in small capitals ("WALLS · 1"),
  rows with a colour dot (Regions) or a finish swatch (Design).
- **Render state**: the render button shows "Rendering…" while it runs, and a failure shows as a
  banner with Try again above the photo. What the render does is in the button's tooltip. Tooltips
  open on hover or keyboard focus, not after a mouse click.
- **Account** (`AccountMenu`): one avatar with the person's initials; clicking it opens their name,
  their email (or that a guest session is saved in this browser) and Sign out.
- **Photo height** (`ImageCanvas`): capped at `100dvh − 18.5rem` (never below 22rem), or
  `100dvh − 22rem` when a row of controls sits above it (`rowAbove`, the Design step); the side
  panels use the same caps so their bottoms meet the photo's.

## The estimate is drawn on the house

The Estimate step answers "where does the money go?" on the house itself (`EstimateDiagram`):

- **Summary** (`EstimateSummary`): the total in one big figure, "Most likely between … and …",
  Materials and Labour as two chips, and what the sizes rest on ("Based on a wall of 30 × 20 ft")
  with Adjust size.
- **The drawing**: the design's preview in the middle, one card per kind of part on either side
  (`PartCard`: colour, "Two pillars", the finish, the size, the cost), and a thin leader line from
  each card to a dot on that part. Parts with no finish are amber cards saying "Not in estimate".
- **Placement** (`utils/partGroups`): a card goes on the side of the photo its part is on, the
  sides are balanced to within one card, each side runs top to bottom, and the dot lands on the
  part of the group nearest the card, so lines rarely cross. Lines are measured from the live
  layout (`useLeaderLines`) and redrawn on resize; on narrow screens the photo comes first and the
  cards stack under it without lines.
- **Below**: one sentence on what is not counted, and See the full breakdown. Download PDF report
  is the step bar's main button.
- **Full breakdown** (`EstimateBreakdown`, `?view=breakdown`): its own page in the step, with
  "Back to your estimate", the total, materials and labour as chips, and three tabs. What to buy
  (`WhatToBuyTable`) lists each material with where it goes ("Three walls"), how much to buy and
  the exact need plus the waste allowance, the material and labour rates (editable, "per sq ft"),
  and the cost split, with a total row. Part sizes has the editable areas; Compare designs puts
  the designs side by side. Good to know (`GoodToKnow`) beside it says what the sizes rest on,
  what is not counted, the parts left out (amber) and that this is a guide, not a quotation.

## The cutting mat

`MatPanel` is the product's material, used in one place: **the sign-in story** (`LoginPage`), the
left half of the sign-in screen, with the headline and the elevation drawing lying on the mat as a
sheet of paper.

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
| Big figure (estimate total) | Nohemi | 52px, 500, −0.02em |

Nohemi (Befonts, commercial use allowed; licence in `exterio-frontend/public/fonts`) ships in two
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
| `MatPanel` | `shared/molecules` | A piece of cutting mat, for the sign-in story |
| `EstimateDiagram`, `PartCard`, `EstimateSummary` | `features/estimate` | The estimate drawn on the house; grouping in `utils/partGroups` |
| `EstimateBreakdown`, `WhatToBuyTable`, `GoodToKnow` | `features/estimate` | The full breakdown page; its wording in `utils/estimateCopy` |
| `AppLayout`, `AuthLayout`, `CenteredLayout` | `shared/layouts` | How each kind of page is laid out |
| `Avatar`, `AccountMenu` | `shared/atoms`, `features/auth` | Initials badge, and the account menu built on it |
| `PAGE_FRAME`, `PAGE_FRAME_BLEED` | `shared/utils/pageFrame` | The full-width frame shared by the app bar, pages and the step bar |
| `AppHeader` | `shared/organisms` | The logo, the page's header slot and the user menu |
| `HeaderSlot` | `shared/contexts/HeaderSlotContext` | Lets a page (the studio) put its navigation into the app header |
| `DropdownMenu`, `FloatingSaveBar`, `NameTagToggle` | `shared/molecules` | The menus, the unsaved-changes bar and the eye button used on the photo |
| `DesignSwitcher` | `features/design` | Design dropdown, ⋯ menu and New design |
| `AdvisorDockProvider`, `AdvisorButton` | `features/advisor` | One advisor panel for the studio, opened from any step |
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
