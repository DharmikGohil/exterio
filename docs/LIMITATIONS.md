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
- **Vision LLM (Gemini 3.1 Pro on Vertex AI, or Claude).** Asks the model to outline each
  component as a polygon. It returns corners rather than pixel-exact edges, so curved or irregular
  shapes are approximated, and results vary a little between runs (the same photo gave 14 regions
  on one run and 16 on another). On the drawn test house it matched the true outlines closely
  (overlap above 0.9 for walls, windows, door, pillars and gate). On two of the real sample photos,
  checked by eye, Gemini 3.1 Pro traced windows, doors, garage doors and shutters tightly, but its
  roof planes were coarse and overlapped each other. It has **not been measured against hand-traced
  outlines on real photographs**, where clutter, shadows and occlusion will lower accuracy.
- **Choosing the detection model.** <a id="choosing-the-detection-model"></a>
  `scripts/benchmark_detection.py` runs detection on the four sample photos and scores it
  against their hand-traced parts. Two runs per photo per model, on 22 Nov 2026 (raw detections
  in [benchmarks/detection-2026-11-22.json](benchmarks/detection-2026-11-22.json)):

  | Model | Wall IoU | Mean surface IoU | Parts found | Parts right | Off-house area | Time |
  |---|---|---|---|---|---|---|
  | Claude Opus 5.5 | **0.88** | **0.74** | **74%** | **60%** | **2.8%** | **36 s** |
  | Gemini 3.1 Pro | 0.78 | 0.68 | 57% | 38% | 4.3% | 44 s |

  IoU is the overlap of the model's outlines with the traced ones (1 is exact). A traced part is
  found when a detected part of the same kind overlaps it by IoU 0.5 or more. Off-house area is
  the share of detected wall and roof area outside the traced house, which catches outlines on a
  neighbouring building. Claude was ahead on every photo, so it outlines parts whenever its key
  is set. Four photos is a small set; the traces are one person's, and "parts right" undercounts
  real parts the traces leave out (fences, gutters).
- **Choosing among the Claude models.** The same benchmark, now also timing the first part
  (detection streams), on the three Claude models the gateway offers, two runs per photo each,
  run side by side on 22 Nov 2026 (raw detections in
  [benchmarks/detection-claude-models-2026-11-22.json](benchmarks/detection-claude-models-2026-11-22.json)):

  | Model | Wall IoU | Mean surface IoU | Parts found | Parts right | Off-house area | First part | Time |
  |---|---|---|---|---|---|---|---|
  | Claude Opus 5.5 | **0.87** | 0.73 | **72%** | 59% | 3.0% | 27 s | 35 s |
  | Claude Sonnet 5.5 | 0.84 | **0.74** | **72%** | **64%** | **2.8%** | **25 s** | **30 s** |
  | Claude Haiku 5.5 | 0.86 | 0.72 | 65% | 57% | 3.7% | 40 s | 43 s |

  The bar for switching was set before the run: no more than 0.02 lower on wall or mean IoU and
  no more than 5 points lower on parts found than Opus. Sonnet's walls were 0.03 lower, for about
  2 s sooner to the first part, and walls drive most of the cost, so Opus stays. Haiku, the
  smallest model, was the slowest to start: most of the wait is the gateway before the model
  writes anything (about 5 s to connect, then a long silence with no thinking in the reply), not
  the size of the model. A direct Anthropic API key, not the gateway, is the likelier way to cut
  that wait. Three runs at once may have slowed each other; the accuracy figures do not depend on
  that.
- **Open-ended parts.** The vision model is asked to outline any exterior part a homeowner could
  refinish. Parts outside the fixed types come back as `other` with the model's own name (on a
  real photo it found "Entrance steps" unprompted), and an unknown label is kept as a named `other`
  part rather than rejected. SAM 3 can only find the types it has prompt words for.
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
- **The wall behind a railing is painted in the picture but not counted in the estimate.** The
  preview gives the wall behind a railing the wall's finish, as a painter would, but the
  measurement still gives those pixels to the railing, so the wall's area is a little low where a
  railing covers it (about 46 sq ft on a two-storey house with two 23 ft balcony railings).
- **The photoreal render's first run after an idle spell is slow.** The Modal renderer shuts down
  after 5 idle minutes. The first render after that took about 30 seconds in testing while the
  GPU starts and loads the model; renders while it is warm took 7–8 seconds.
- **Modal against Gemini for the photoreal render** (`scripts/compare_photoreal.py`, the four
  sample houses, 22 Nov 2026). Gemini 2.5 Flash Image looked more photographic and was the only
  one to show the chosen metal roofs as metal (Modal's SDXL left them looking like shingles). But
  it took liberties the brief forbids: it removed the lamp post in front of the ranch's garage,
  turned the two-storey house's white trim dark and its sage walls a deeper green than chosen.
  Modal kept every object, edge and colour. Gemini took about 10 s every time; Modal 7 to 8 s
  when warm and about 50 s from cold. Modal stays the default (`PHOTOREAL_RENDERER=modal`);
  Gemini is one setting away.
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
