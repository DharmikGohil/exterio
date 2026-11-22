# Design System

How the interface looks and why. The tokens live in
[`exterio-frontend/tailwind.config.ts`](../exterio-frontend/tailwind.config.ts); this file explains how to use them.

## Direction

| | |
|---|---|
| **Product** | Plan, picture and price an exterior renovation, for a homeowner in India |
| **Character** | Exact, grounded, a little warm |
| **World** | The drafting desk: a green cutting mat, a photo of the house, a scale ruler |
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

## Your houses: the home screen

`ProjectListPage` lists every house as a card (`ProjectCard`): the photo, the name with a ⋯ menu
(Rename, Delete), a five-segment bar and "Step 3 of 5 · Designing" (`StepProgress`), then
"2 designs · edited 22 Nov 2026" and the estimate total, or "No estimate yet". The step and total
come from the API, so they always match the studio. The first card is a dashed "Start a new
house" (`NewHouseCard`), which also offers the sample house. Above the grid, a search box and a
sort (Recently edited, Name, Furthest along) narrow and order the cards (`utils/projectList`);
while searching, the new-house card steps aside.

## The studio: tools live on the photo

Every studio step has the same shape: a big title with one line of description, the photo on the
left with its tools floating on it, a panel on the right, and the step bar pinned at the bottom.
Everything is in view without scrolling on screens from 1280×720 up.
The photo's frame hugs the photo (`utils/photoFrame`): its width is the photo's width at the
tallest the photo may be, or the full column if that is narrower, so a wide screen shows no grey
bands beside the photo and the tools in its corners sit on the photo itself. On Design, the row of
controls above the photo is measured: when it wraps onto two lines on a narrower screen, the
photo and the parts panel give up that height, so the step bar still fits on screen. To keep that
row on one line from 1280 px up, the view switches (Design, Before / after, Preview,
Photoreal) show only their icons below 1400 px and New design is a "+" below 1600 px; their
names stay as tooltips and accessible names.

- **Header**: the studio puts its breadcrumb and stepper into the app header through a header slot
  (`HeaderSlot`, a portal), so there is no second bar. The stepper (`StudioStepper`) is a row of pills on
  a pale green track: done steps are green with a check in a dark circle, the current step is a
  raised white pill with its step's icon (camera, shapes, palette, ruler, rupee), upcoming steps
  show their number. Below `lg` only the circles show; each step keeps its name as its label. Projects are renamed only on the home screen (the ⋯ menu on each house card).
- **Material advisor**: "Ask about materials" sits in the step header (Photo, Regions, Estimate)
  or in the panel header (Design). Its chat panel is mounted once for the studio
  (`AdvisorDockProvider`), so the conversation survives moving between steps. While it answers,
  the panel shows its work instead of a spinner: a timeline of steps (searching notes, checking
  the house, writing), each with a spinner and a shimmering label while it runs and what it found
  once done, a skeleton until the text starts, then the text typed out with a caret. Once
  answered, the steps fold into one line ("✓ Searched material notes · Checked your house ›")
  that opens them again. The notes an answer drew on are listed under it as buttons, one per
  line so a long title wraps inside its box; clicking one asks "Tell me more about “…” for my
  house." straight away (disabled while another answer is arriving).
- **Photo and panel stay together** (`photoGridStyle`): the photo column is only as wide as the
  photo can be at its tallest, and the two columns are centred as a pair, so a tall photo has its
  panel right beside it (20px apart) instead of across an empty gap.
- **A row of tools above the photo and its panel**, so no tool ever covers part of the house and a
  tall, narrow photo never squeezes the tools:
  - Regions: Draw region and Auto-detect on the left (Finish shape, Undo point and Cancel while
    drawing; Remove point with a point selected), Undo and Redo on the right;
  - Design: the design picker on the left, the view switches (Design or Before / after, Preview
    or Photoreal, each with an icon) on the right.
  The row is measured, and the photo and the side panel give up its real height, so the step bar
  stays on screen even when the row wraps.
- **Auto-detect progress** (`DetectionProgress`, `useRegionReveal`):
  - While the AI works (about 25 to 40 s), a soft green glow and a sheen sweep over the photo,
    and a pill at its bottom edge says what the AI looks for and the seconds so far ("Outlining
    the walls and the roof · 12 s"); after 55 s it says the wait is longer than usual. The AI
    reports nothing until it answers, so these phrases are paced by time (`useDetectionProgress`).
  - When the answer arrives, the parts it found are drawn one after another, 160 ms apart: roofs
    and walls first, then openings, then pillars, railings, gates and fences, each kind top to
    bottom (`utils/detectionReveal`). Each outline traces in and its fill fades up, its name tag
    pops up, and its row slides into the list with a mint flash. The pill counts them ("Found 6
    parts · Outlining the walls and roof"), then says "All done: 20 parts found · Review them and
    fix anything wrong" for 3 s. This paces how the real result is shown; with reduced motion
    every part appears at once.
- **Undo and redo on Regions** (`useRegionDraft`): every change to the parts can be undone with
  Ctrl+Z (⌘Z) or the Undo button and redone with Ctrl+Shift+Z or Ctrl+Y. A corner dragged across
  the photo, or a name typed letter by letter, is one step; deleting a part, Discard and
  Auto-detect can be undone too. While drawing, Ctrl+Z removes the last point. Typing in a field
  keeps the field's own undo.
- **On the photo itself**, only light overlays:
  - top right, the names toggle, an eye button (`NameTagToggle`);
  - top centre, a progress note on Design ("Updating preview…"). On Regions the editing help
    ("Click around the edge of one part…") is a single line under the tools instead, always
    present so the photo never moves, and never over the house;
  - bottom centre, the one action the photo is waiting for: the unsaved-changes bar with Discard
    and Save regions (`FloatingSaveBar`, Regions, shown only when something changed) or Generate
    render (Design); on Scale, the instruction to drag the corners sits bottom left.
- **Design picker** (`DesignSwitcher`): the current design in a dark dropdown, labelled
  "Design: Warm stone and cream" so it reads as a design and not a house name, listing all designs,
  a "⋯" menu (`DropdownMenu`) to rename, duplicate or delete it, and New design.
- **Scale is step 4, after Design, and optional**: its footer says "Optional: continue and the
  estimate stays rough" until a valid size is entered. Without a size, the Design header says
  "Rough total · Add a real size in the next step", and the estimate card says "Rough total",
  "Based on a rough guess" and offers a green "Set the size" instead of "Adjust size".
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

- **Summary** (`EstimateSummary`): three columns. *Estimated total* (or *Rough total*): the
  figure, "for materials and labour together", and See the full breakdown. *What it is made of*:
  one bar split into materials and labour, with each share and amount. *How sure we are*: the
  likely range as a track with the total's dot on it, the low and high ends and "within ±8%",
  then what the sizes rest on ("Based on a wall of 30 × 20 ft") with Adjust size, or Set the size
  while the size is a rough guess.
- **The drawing**: the design's preview in the middle, one card per kind of part on either side
  (`PartCard`: colour, "Two pillars", the finish, the size, the cost), and a thin leader line from
  each card to a dot on that part. Parts with no finish are amber cards saying "Not in estimate".
- **Placement** (`utils/partGroups`): a card goes on the side of the photo its part is on, the
  sides are balanced to within one card, each side runs top to bottom, and the dot lands on the
  part of the group nearest the card, so lines rarely cross. Lines are measured from the live
  layout (`useLeaderLines`) and redrawn on resize; on narrow screens the photo comes first and the
  cards stack under it without lines.
- **See the full breakdown** is a button under the total in the summary card, visible without
  scrolling. The design picker in the header reads "Design: …". Below the drawing, one sentence on
  what is not counted. Download PDF report is the step bar's main button.
- **Full breakdown** (`EstimateBreakdown`, `?view=breakdown`): its own page in the step, with
  "Back to your estimate", the total, materials and labour as chips, and three tabs. What to buy
  (`WhatToBuyTable`) lists each material with where it goes ("Three walls"), how much to buy and
  the exact need plus the waste allowance, the material and labour rates (editable, "per sq ft"),
  and the cost split, with a total row. Part sizes has the editable areas; Compare designs puts
  the designs side by side. Good to know (`GoodToKnow`) beside it says what the sizes rest on,
  what is not counted, the parts left out (amber) and that this is a guide, not a quotation.

## The cutting mat

`MatPanel` is the product's material, used in one place: **the sign-in story** (`LoginPage`), the
left half of the sign-in screen, with the headline and a real house before and after lying on the
mat (`BeforeAfterShowcase`). Each house takes 6 seconds: the photo as it is, the new finishes
sweeping across behind a thin white line, then an arrow drawn from each of the three costliest
finishes to the part it is on, with a label over the sky ("Roof · Charcoal metal roof · ₹17,348"),
like the estimate drawn on the house. The arrows stay hidden until the finishes are fully on, and
are drawn in real pixels so each one grows from its label. The finished photo carries an "After,
in Exterio" tag with the logo mark in the brand green: the product signs its own work, in its one
accent colour rather than a new one. Then the next house. The caption names the house, the design
and its total; dots pick a house. Photos, renders, costs and arrow points all come from the sample
houses through the product's own preview and estimate (`exterio-backend/scripts/render_showcase.py`
writes the images and `utils/showcaseData.ts`); each arrow lands on the point deepest inside its
finish, so never on a window or an edge. With reduced motion the finished photo and its arrows are
shown still and only the dots change the house. The right
half has the Sign in / Create account form with Sign in as the one green button, then "or" and
Try it with a sample house as an outline button (`SampleHouseAccess`).

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
- Nothing loops unless it is live (a check or detection that is actually running). The one
  exception is the sign-in showcase, a 6-second before / after with arrows that is the page's
  subject.
- `prefers-reduced-motion` turns animation off.

## Component map

| Component | Where | Role |
|---|---|---|
| `MatAngleGuides` | `shared/atoms` | The 30°, 45° and 60° guides in a mat's corner |
| `BeforeAfterShowcase` | `features/auth` | The sign-in page's before / after sweep; houses in `utils/showcase` |
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
| `ProjectCard`, `StepProgress`, `NewHouseCard`, `ProjectToolbar` | `features/projects` | The Your houses page |
| `AdvisorDockProvider`, `AdvisorButton` | `features/advisor` | One advisor panel for the studio, opened from any step |
| `PageBackdrop` | `shared/organisms` | The quiet drafting-paper grid behind every page |
| `DimensionLine` | `shared/molecules` | A figure written as a dimension, light or mat tone |
| `SvgDimension` | `shared/molecules` | A dimension line drawn on the photo |
| `RegionNameTag` | `shared/molecules` | Region name pinned on the photo; layout in `utils/nameTagLayout` |
| `Skeleton`, `ShimmerOverlay` | `shared` | Loading states |
| `StepFooter` | `features/studio` | The step bar pinned to the bottom of the studio |
| `Logo`, `LogoMark` | `shared/atoms` | Wordmark and a flat gable-and-dimension mark; the mark alone for badges |

The redesign followed the *unslop* method by Damir Sokolovsky
([@heydamir](https://x.com/heydamir), CC BY 4.0): audit, a written direction, then passes for
spacing, colour, icons, copy, type, layout, details, visuals and motion.
