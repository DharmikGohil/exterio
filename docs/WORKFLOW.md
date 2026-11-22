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
  B --> B2[Review: relabel, reshape, add, delete] --> C
  C[3. Scale<br/>mark the facade and give one real measurement] --> D
  D[4. Design<br/>click a region, pick a material] --> D2{Happy?}
  D2 -- try another --> D3[Duplicate into Design B / C] --> D
  D2 -- yes --> R[Generate photoreal render<br/>compare before and after]
  R --> E[5. Estimate and report<br/>areas, quantities, costs]
  E --> E2[Edit a rate, wastage or area<br/>totals recalculate] --> E
  E --> F([Download PDF for the contractor])
  E -. compare designs side by side .-> D
```

## What happens at each step

| Step | The user does | The system does |
|---|---|---|
| **1. Photo** | Uploads a JPG, PNG or WebP | Fixes orientation, resizes to a working size, scores sharpness, brightness and resolution, and (if configured) asks a vision model whether it is a usable house exterior. Bad photos are rejected with specific tips. |
| **2. Regions** | Clicks "Auto-detect", then fixes anything wrong | Asks the configured AI provider to outline each component and turns the result into editable polygons. Hand-drawn regions survive a re-run of detection. |
| **3. Scale** | Drags four corners onto the main wall and enters a wall size, one known length, a door height, or the number of floors | Removes perspective and converts pixels to feet. Shows how confident the result is for the chosen method. |
| **4. Design** | Selects a region and a material; saves alternatives as separate designs | Re-renders the instant preview in well under a second. On request, produces a photoreal render in the background. |
| **5. Estimate** | Sees the house with a card per kind of part (finish, size, cost) and a line to each part; opens the full breakdown to edit rates, wastage or an area if they know better | Computes net area, wastage, purchase quantity, material and labour cost per line, per category and in total, with a low–high range. Builds the PDF. |

## Design choices made for non-technical users

- **Try it with a sample house.** One button on the sign-in page, with no sign-up. It signs in to
  the shared reviewer account, which already holds a finished sample house; deployments without
  one start a guest session and create the sample house for it first, so either way the first
  screen has a house to open.
- **Steady sign-in form.** The form is anchored to the top, so switching between Sign in and
  Create account never moves the tabs, and the password fields have a show/hide button. Create account asks for the
  password twice and says as soon as the two differ.
- **A sample house.** The whole flow can be seen in under a minute without owning a suitable photo.
  It is a real photograph of a two-storey house with its 26 parts already traced (walls, roof,
  eaves, windows, doors, balcony, railings, steps), so finishes land on real siding and shadows,
  and it works the same with or without AI detection.
- **No feature that cannot work is shown.** When the server has no image model, the photoreal
  render button and tab are hidden rather than shown disabled with an apology.
- **Nothing is a dead end.** If detection misses a pillar, it can be drawn. If no measurement is
  known, a door or floor count still gives an estimate, clearly marked as rougher.
- **Instant feedback first, AI second.** Trying a material is immediate and free. The slower,
  paid AI render is an explicit button, not something that runs on every click.
- **Plain language.** Scale methods are described as "I know the wall size", not by method name.
- **Every number can be questioned.** Each total shows the assumptions behind it, and any area or
  rate can be overridden; overrides are flagged in the report.
