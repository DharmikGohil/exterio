# User Workflow

The product is a five-step studio. A stepper at the top shows where the user is; any step can be
revisited once a photo exists, and every change is saved to the project.

```mermaid
flowchart TD
  S([Sign in, or try it with a sample house]) --> L[Your houses<br/>progress and total per house<br/>New project / sample house]
  L --> A[1. Photo<br/>upload a picture of the house]
  A --> Q{Quality gate}
  Q -- rejected --> G[Show the reasons and how to retake it] --> A
  Q -- accepted, maybe with warnings --> B[2. Regions<br/>auto-detect or draw]
  B --> B2[Review: relabel, reshape, add, delete] --> D
  D[3. Design<br/>click a region, pick a material<br/>rough total from an assumed size] --> D2{Happy?}
  D2 -- try another --> D3[Duplicate into Design B / C] --> D
  D2 -- yes --> R[Generate photoreal render<br/>compare before and after]
  R --> C[4. Scale, optional<br/>mark the facade and give one real measurement]
  C --> E[5. Estimate and report<br/>areas, quantities, costs]
  R -. skip the size: rough estimate .-> E
  E --> E2[Edit a rate, wastage or area<br/>totals recalculate] --> E
  E --> F([Download PDF for the contractor])
  E -. compare designs side by side .-> D
```

## What happens at each step

| Step | The user does | The system does |
|---|---|---|
| **1. Photo** | Uploads a JPG, PNG or WebP | Fixes orientation, resizes to a working size, scores sharpness, brightness and resolution, and (if configured) asks a vision model whether it is a usable house exterior. Bad photos are rejected with specific tips. |
| **2. Regions** | Clicks "Auto-detect", then fixes anything wrong | Asks the configured AI provider to outline each component and turns the result into editable polygons. Hand-drawn regions survive a re-run of detection. |
| **3. Design** | Selects a region and a material; saves alternatives as separate designs | Re-renders the instant preview in well under a second. On request, produces a photoreal render in the background. Shows a running total, marked "Rough total" while no real size is given. |
| **4. Scale** (optional) | Drags four corners onto the main wall and enters a wall size, one known length, a door height, or the number of floors, or continues without | Removes perspective and converts pixels to feet. Shows how confident the result is for the chosen method. Skipped, the estimate uses an assumed 10 ft storey and is labelled rough. |
| **5. Estimate** | Sees the house with a card per kind of part (finish, size, cost) and a line to each part; opens the full breakdown to edit rates, wastage or an area if they know better | Computes net area, wastage, purchase quantity, material and labour cost per line, per category and in total, with a low–high range. Builds the PDF. |

## Design choices made for non-technical users

- **The size comes after the design, and is optional.** The size only turns the picture into
  square feet and rupees; choosing finishes does not need it. Asking for a real measurement
  before Design stopped people before the enjoyable part. Now they design first (with a rough
  total), and reach Scale when they want the price, which gives them a reason to measure. Skipping
  it still gives an estimate, labelled rough, with "Set the size" on the summary card.

- **Try it with a sample house.** One button on the sign-in page, with no sign-up. It signs in to
  the shared reviewer account, which already holds a finished sample house; deployments without
  one start a guest session and create the sample house for it first, so either way the first
  screen has a house to open.
- **Steady sign-in form.** The form is anchored to the top, so switching between Sign in and
  Create account never moves the tabs, and the password fields have a show/hide button. Create account asks for the
  password twice and says as soon as the two differ.
- **Sample houses, one at each stage.** The whole flow can be seen without owning a suitable
  photo. Four real photographs are created at different stages, so between them they show every
  step and Your houses shows every kind of progress:

  | Sample | Created with | Opens at |
  |---|---|---|
  | Single-storey ranch | the photo alone | Photo, then Regions for Auto-detect |
  | Two-storey with garage | photo and traced parts | Design, with no finishes yet |
  | Brick house with dormers | parts and a finished design, no size | Scale, with a rough estimate |
  | Craftsman with stone | a finished design and its size | Estimate |

  The demo account starts with all four; each "try a sample house" adds the next one and opens it
  at its own step. A house opens at the next thing left to do (parts, design, size, estimate).
- **The photo check, the first time.** The first time a browser opens a house that has only its
  photo, the saved photo check is walked through stage by stage over the photo, as right after an
  upload, and then shown. It is remembered per house in the browser, so it plays once; an upload
  in this browser counts as seen, and reduced motion skips it.
- **Before and after on the sign-in page.** Those houses sweep from their photo to their new
  finishes, so the product explains itself before anyone signs in.
- **A guided tour, once.** The first time each page is opened, a short tour dims the page and
  points at its main parts one at a time; the ⓘ button in the header shows it again. See
  [DESIGN.md](DESIGN.md#the-guided-tour).
- **No feature that cannot work is shown.** When the server has no image model, the photoreal
  render button and tab are hidden rather than shown disabled with an apology.
- **Nothing is a dead end.** If detection misses a pillar, it can be drawn. If no measurement is
  known, a door or floor count still gives an estimate, clearly marked as rougher.
- **Instant feedback first, AI second.** Trying a material is immediate and free. The slower,
  paid AI render is an explicit button, not something that runs on every click.
- **Plain language.** Scale methods are described as "I know the wall size", not by method name.
- **Every number can be questioned.** Each total shows the assumptions behind it, and any area or
  rate can be overridden; overrides are flagged in the report.
