# How the Estimation Works

This document explains every step between a photo and a rupee figure, with the formulas and the
places in the code where each one lives.

```
photo ─► regions ─► rectified pixels ─► feet ─► sq ft / running ft ─► quantity ─► cost
          (1)            (2)             (3)          (4)                (5)        (6)
```

The pixel work (steps 1–2) is in `infrastructure/services/imaging/`. Everything from step 3 on is
pure arithmetic in `domain/services/`, with unit tests that check it against hand calculations.

---

## 1. Regions: what gets measured

Every surface is a polygon with a label: `wall`, `window`, `door`, `balcony`, `pillar`, `parapet`,
`gate`, `roof_edge` or `railing`. Regions come from AI detection and from the user's corrections.

**Overlaps are resolved by priority.** Regions are painted onto a single label map from lowest to
highest priority, so a higher one overwrites a lower one:

```
wall < roof edge < parapet < balcony < pillar < gate < railing < door < window
```

The consequence is the rule a contractor would apply by hand: **a window drawn on a wall removes
its area from the wall.** No polygon clipping is needed, and openings can never be painted or
costed by mistake. Windows and doors are detected only so they can be subtracted and used as scale
references; no finish can be assigned to them.

## 2. Removing perspective

A photo taken from the street is not a front elevation. A wall that is 30 ft wide may be 900 pixels
wide at the near end and 700 at the far end, so raw pixel counts are not proportional to area.

The user confirms the **four corners of the main facade**. Those four points define a homography
that maps the photo onto a flat, front-on rectangle (`perspective.build_rectification`). Every
region polygon is mapped through it, and areas are counted on that rectified canvas, where one
pixel covers the same real area everywhere on the wall plane.

### The aspect-ratio problem

Four corners fix the homography but not the rectangle's shape: the same four points are consistent
with a wide low wall seen at a sharp angle or a narrower wall seen nearly front-on. The width-to-
height ratio has to come from somewhere:

1. **The user typed both dimensions** ("30 ft wide, 20 ft high"). The ratio is known exactly.
2. **Otherwise it is recovered from the corners** with the method of Zhang and He (2007), which
   assumes square pixels and a principal point at the image centre. With two finite vanishing
   points the camera's focal length falls out of the geometry and the ratio is exact for any lens.
3. **If the camera was held level**, vertical edges are parallel, there is only one vanishing
   point, and the focal length cannot be recovered. A typical phone focal length
   (0.75 × the long side of the image, about a 26 mm equivalent lens) is assumed instead.

The tests in `imaging/__tests__/test_perspective.py` photograph a known rectangle with a simulated
pinhole camera and check each case: case 2 recovers the ratio within 2% for three different focal
lengths; case 3 is exact for a phone-like lens and within 12% for a noticeably different one.

## 3. Pixels to feet: the scale

A photo has no scale. One real measurement is needed, and the user chooses where it comes from:

| Method | What the user provides | Feet per pixel | Linear uncertainty | Band on area and cost |
|---|---|---|---|---|
| Wall size | Width and height of the marked facade | `width_ft / facade_width_px` horizontally, `height_ft / facade_height_px` vertically | 4% | ±8% |
| One measurement | A line drawn on the photo and its length | `length_ft / rectified_line_px` | 6% | ±12% |
| Door reference | Nothing (door height defaults to 7 ft, editable) | `door_height_ft / tallest_door_px` | 10% | ±20% |
| Floors | Number of storeys (10 ft each) | `storeys × 10 / facade_height_px` | 15% | ±30% |

**Why the band is double the linear figure.** Area is length squared, so
`(1 + e)² ≈ 1 + 2e`: a 10% error in the reference length becomes roughly a 20% error in every area
and therefore in every cost. Published work on facade measurement from a single reference object
reports the same relationship. The band is shown next to the grand total as a low–high range, and
it is the honest answer to "how accurate is this?".

If the chosen method is missing its input (door reference with no door detected, for example) the
resolver falls back to the next method that can work and says so in the estimate's notes. It never
silently substitutes a different method for one that has what it needs.

Code: `domain/services/scale_resolver.py`.

## 4. Areas and lengths

For each region, from its pixel count and bounding box on the rectified canvas:

```
area_sqft  = pixel_count × feet_per_px_x × feet_per_px_y × surface_multiplier
length_ft  = bounding_width_px × feet_per_px_x
```

- **Railings** are costed by running length. Their area is reported as `length × height`.
- **Surface multiplier** covers faces the camera cannot see. A porch pillar shows one face but
  usually has three to finish, so detected pillars default to 3. It is editable per region.
- **Overrides.** The user can type an area or length for any region. The typed value replaces the
  computed one and the row is flagged in the UI and in the report.

Code: `domain/services/area_calculator.py`.

### Measured accuracy

The built-in sample house is drawn at known dimensions and photographed by a simulated camera 13°
off-axis, so it doubles as ground truth (`imaging/__tests__/test_surface_measurement.py`):

| Surface | True | Measured | Error |
|---|---|---|---|
| Front wall, net of all openings and overlays | 378.7 sq ft | 376.8 sq ft | 0.5% |
| Parapet | 90.0 sq ft | 90.9 sq ft | 1.0% |
| Main door | 24.5 sq ft | 24.7 sq ft | 0.8% |
| Window (each) | 20.0 sq ft | 20.3 sq ft | 1.3% |
| Pillar, three faces | 34.2 sq ft | 35.1 sq ft | 2.7% |
| Railing length | 10.0 ft | 10.0 ft | 0.0% |

These figures show that the geometry and arithmetic are correct when regions and scale are right.
They are **not** a claim about real photographs, where the dominant errors are region boundaries
and the scale reference. See [LIMITATIONS.md](LIMITATIONS.md).

## 5. Quantities

Areas are grouped by the material assigned to each region.

```
net_quantity    = Σ area_sqft   (or Σ length_ft for railings)
gross_quantity  = net_quantity × (1 + wastage% / 100)
```

The gross quantity is then turned into what a shop actually sells:

| Material type | Purchase quantity | Default basis |
|---|---|---|
| Paint | `ceil(gross / coverage)` litres | 55 sq ft per litre for two coats on a smooth wall |
| Texture finish | `ceil(gross × consumption)` kg | 0.18–0.20 kg per sq ft |
| Tiles, planks | `ceil(gross / piece_area)` pieces | 4 sq ft per 2 ft × 2 ft tile |
| Panels | `ceil(gross / sheet_area)` sheets | 32 sq ft per 4 ft × 8 ft sheet |
| Stone cladding | `ceil(gross)` sq ft | sold by area |
| Railings | `ceil(gross)` running ft | sold by length |

Default wastage: paint 5%, texture 8%, tiles and panels 10%, stone 10–12%, railings 3%. These are
common trade rules of thumb rather than a cited standard, which is why each one is editable.

Code: `domain/services/quantity_calculator.py`.

## 6. Cost

```
material_cost  = gross_quantity × material_rate
labour_cost    = net_quantity   × labour_rate
line_total     = material_cost + labour_cost
category_total = Σ line_total within a category
grand_total    = Σ line_total
range          = grand_total × (1 ∓ confidence_band)
```

Material is charged on the **gross** quantity because wastage has to be bought. Labour is charged
on the **net** quantity because nobody is paid to install offcuts.

Rates come from a predefined rate card. The user can change the material rate, labour rate or
wastage for any material; the change is stored as a per-project override and the estimate is
recomputed on the next read. Nothing is cached, so the numbers on screen always reflect the current
regions, scale, design and rates.

Code: `domain/services/cost_calculator.py`, assembled in `estimate_builder.py`.

### Worked example

A 10 ft × 10 ft wall with one 3 ft × 4 ft window, painted, at the default rates:

```
wall net area   = 100 − 12            = 88 sq ft
with 5% wastage = 88 × 1.05           = 92.4 sq ft
paint to buy    = ceil(92.4 / 55)     = 2 litres
material cost   = 92.4 × ₹14          = ₹1,293.60
labour cost     = 88 × ₹12            = ₹1,056.00
total                                 = ₹2,349.60
```

This exact case is a unit test (`test_estimate_builder.py`).

## Default rate card

Indicative 2026 figures in INR, researched from public cost guides. They are starting points to be
edited, not quotations.

| Item | Unit | Public range, installed | Default material | Default labour |
|---|---|---|---|---|
| Exterior emulsion, two coats | sq ft | ₹18–35 | 14 | 12 |
| Premium elastomeric paint | sq ft | – | 22 | 13 |
| Texture finish | sq ft | ₹40–150 | 45–50 | 30–32 |
| Natural stone cladding | sq ft | ₹180–450 | 220–260 | 80–90 |
| Brick tile cladding | sq ft | – | 120 | 60 |
| Glass railing, 12 mm toughened | running ft | ₹1,850–2,850 | 1,900 | 400 |
| SS 304 railing | running ft | ₹600–1,600 | 850 | 250 |
| Elevation tiles | sq ft | not found | 70–95 | 40–45 |
| ACP / HPL panels | sq ft | not found | 240 / 480 | 60–70 |

Where a source quotes one all-in rate, the split between material and labour is an assumption. No
reliable public figure was found for elevation tiles or ACP/HPL panels, so those defaults are
placeholders that should be checked against a local quote.

Sources: [Asian Paints](https://www.asianpaints.com/blogs/painting-cost-per-sq-ft-india.html),
[Houseyog](https://www.houseyog.com/blog/wall-painting-cost-per-sq-ft-in-india-interior-exterior/),
[Enteriors](https://enteriors.in/wall-design/stone-wall-cladding/),
[NoBroker railings](https://www.nobroker.in/interiors/design-guides/stainless-steel-railing-cost/),
[Dulux coverage](https://www.dulux.in/en/products/dulux-promise-exterior/cccId_1561315),
[facade measurement from a reference object](https://arxiv.org/pdf/2510.00797).

## The visual side uses the same numbers

The instant preview reuses the measurement from steps 2 and 3. Each material's texture is tiled at
its real size (a 2 ft tile is drawn 2 ft wide at the resolved scale), laid out on the rectified
canvas, and warped back into the photo with the inverse homography, so joints and courses follow
the wall's perspective. It is then multiplied by the photo's own low-frequency lightness so
existing shadows survive, and blended inside the region mask only.

The photoreal render starts from that preview. The image model is asked to improve realism only,
and afterwards the original pixels are pasted back everywhere outside the edited regions. Structure
is preserved by construction rather than by trusting the model.
