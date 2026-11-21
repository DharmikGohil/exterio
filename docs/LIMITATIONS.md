# Limitations

This is a pre-construction planning aid. It narrows the conversation with a contractor; it does not
replace a site measurement. The points below are the ones that matter when deciding how far to
trust a result.

## Measurement

| Limitation | Why | What it does to the numbers | Mitigation in the product |
|---|---|---|---|
| **One plane per photo.** | A single homography flattens one plane. Side walls, recessed balconies, projecting porches and a gate in front of the house are on other planes. | Surfaces behind the plane are under-measured; surfaces in front are over-measured. The error grows with the distance from the main plane. | Each region's area can be typed in by hand and is then flagged. Stated in every report. |
| **Only what is visible is counted.** | Hidden sides and anything behind a tree, car or wall are not in the photo. | The estimate covers the photographed elevation, not the house. | Stated in every report. A project is one elevation. |
| **Scale error is squared.** | Area is length squared. | A 10% error in the reference length is roughly 20% in every area and cost. | A ± band per scale method is shown on the total. The most accurate method (typed wall size) is listed first. |
| **Assumed sizes are assumptions.** | A door is taken as 7 ft and a storey as 10 ft unless the user says otherwise. | Real doors range from about 6.5 to 8 ft, which alone is ±10% on length. | Both values are editable and these methods carry the widest bands. |
| **Level-camera photos need an assumed lens.** | With parallel verticals the focal length cannot be recovered from the corners. | Width relative to height can be off by around 10% for a lens far from a typical phone camera. | Avoided entirely by typing the wall width and height. |
| **Lens distortion is not corrected.** | Wide-angle and panorama shots bend straight lines; a homography assumes they are straight. | Errors grow towards the edges of the frame. | Very wide images are flagged at upload. |
| **Curved and irregular surfaces.** | Round pillars, arches and curved balconies are treated as flat. | A round pillar's surface is π/2 ≈ 1.57 times its visible width; the default multiplier does not know the shape. | The per-region surface multiplier. |
| **Region boundaries decide everything.** | A boundary a few pixels off on a long edge is a few square feet. | Usually 1–5% per region; much more if a region is mislabelled or missed. | The review step, with manual reshape, relabel, add and delete. |

Accuracy has been verified on a synthetic scene with exact ground truth (0.5–3% error, see
[ESTIMATION.md](ESTIMATION.md)). It has **not** been benchmarked on a set of real photographs with
tape-measured walls. That benchmark is the first thing to build before relying on the numbers.

## Region detection

Two providers implement detection; the first one configured is used.

- **Segmentation model (SAM 3, needs `FAL_KEY`).** Prompted with words such as "window" or
  "parapet wall on the roof". Expected to be strongest on windows, doors and gates and weakest on
  parapets, pillars and roof edges, which often share the wall's colour. The integration was
  written against the published schema but has **not been run against the live service**; the
  tests use a fake provider.
- **Vision LLM (needs only the Claude key).** Asks the model to outline each component as a polygon.
  It returns corners rather than pixel-exact edges, so curved or irregular shapes are approximated,
  and results vary a little between runs (the same photo gave 14 regions on one run and 16 on
  another). On the built-in sample house it matched the true outlines closely (overlap above 0.9 for
  walls, windows, door, pillars and gate), but that is a clean drawing; it has **not been
  evaluated on real photographs**, where clutter, shadows and occlusion will lower accuracy.
- Neither provider was tuned on Indian residential architecture.
- Every detected region is a suggestion. The review step exists because detection will be wrong
  somewhere on most real photos.
- Without any key the feature is off and regions are drawn manually.

## Visualization

- **The instant preview is a material mock-up, not a photograph.** Textures are procedural, lit
  only by the photo's existing shading. It has no reflections, no depth in joints and no awareness
  of what is physically behind a region.
- **Replacing a railing does not remove the old one.** A transparent material such as glass is
  blended over whatever was there.
- **The photoreal render's first run after an idle spell is slow.** The Modal renderer shuts down
  after 5 idle minutes. The first render after that took about 30 seconds in testing while the
  GPU starts and loads the model; renders while it is warm took 7–8 seconds.
- **The photoreal render depends on an image model.** Its realism varies between runs, and
  it can subtly restyle a surface it was asked only to relight. Geometry outside the edited regions
  is protected by pasting the original pixels back, but *inside* an edited region the model's
  output is used as returned.
- Colours on screen are not colour-accurate. A paint shade should be confirmed with a physical
  sample.

## Cost

- **Rates are indicative.** Defaults come from public 2026 cost guides for India and vary by city,
  brand, wall condition and building height. Two rows (elevation tiles and ACP/HPL panels) are
  placeholders because no reliable public figure was found.
- **Excluded:** GST, scaffolding, surface preparation and crack repair, waterproofing, removal of
  existing finishes, transport, and contractor margin on small jobs.
- **One rate per material.** Real quotes vary with height (work above the first floor costs more)
  and with how fiddly the surface is.
- **Wastage percentages are rules of thumb**, not a cited standard.
- Purchase quantities are rounded up to whole units but not to pack sizes (paint is sold in 1, 4,
  10 and 20 litre tins).

## Product and engineering

- Images only. Video and multi-photo 3D reconstruction are not supported.
- One photo per project. Several elevations need several projects.
- Files are stored on the API server's disk. A host without a persistent volume loses uploads on
  redeploy.
- The photoreal render runs as an in-process background task. A restart during a render leaves the
  design marked as pending until it is requested again.
- The schema is created at start-up. There are no versioned migrations yet.
- The material advisor retrieves notes by keyword similarity (TF-IDF), which works for a small
  knowledge base but will miss paraphrases that share no words with the notes. Its knowledge base
  is general guidance, not product data sheets.
- The demo account is shared by everyone who opens the live URL, so one reviewer's edits are what
  the next one sees. Its password is published on purpose; never reuse a real one there.
- Guest accounts are tied to a browser token. Clearing browser storage loses access to that
  guest's projects.
- No structural advice is given or implied. Heavy cladding needs a check by an engineer.

## What would most improve accuracy next

1. A benchmark of real photos with measured walls, to replace assumed error bands with observed ones.
2. Multi-plane support: let the user mark a second facade plane with its own corners.
3. A metric-depth model as an automatic sanity check on the user's scale.
4. Fine-tuning or few-shot prompting detection on Indian house fronts, especially parapets and pillars.
5. Height-dependent labour rates and pack-size rounding.
