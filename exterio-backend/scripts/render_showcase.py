"""Renders the before / after pairs shown on the sign-in page, and the arrows drawn on them.

Each sample house is rendered with its finished design by the same instant preview the studio
uses, and priced by the same estimate, so the sign-in page shows exactly what the product does:
the photo, the new finishes, and an arrow from each of the three costliest finishes to the part it
is on. Run from exterio-backend after changing a sample house, the renderer or the rates:

    uv run python scripts/render_showcase.py
"""

import json
import sys
from datetime import UTC, datetime
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from domain.entities.design_entity import Design  # noqa: E402
from domain.entities.project_entity import Project, ProjectImage  # noqa: E402
from domain.entities.region_entity import Region, RegionLabel  # noqa: E402
from domain.interfaces.services.image_services import PreviewRequest, SampleHouse  # noqa: E402
from domain.services.estimate_builder import build_estimate  # noqa: E402
from domain.use_cases.estimate.measure_facade_usecase import MeasureFacadeUseCase  # noqa: E402
from infrastructure.repository.implementation.material_repo_impl import (  # noqa: E402
    JsonMaterialRepository,
)
from infrastructure.services.imaging.image_codec import decode_image  # noqa: E402
from infrastructure.services.imaging.opencv_preview_render_service import (  # noqa: E402
    OpenCvPreviewRenderService,
)
from infrastructure.services.imaging.opencv_surface_measurement_service import (  # noqa: E402
    OpenCvSurfaceMeasurementService,
)
from infrastructure.services.imaging.photo_sample_house_provider import (  # noqa: E402
    PhotoSampleHouseProvider,
)

FRONTEND = Path(__file__).resolve().parents[2] / "exterio-frontend"
OUTPUT_DIR = FRONTEND / "public" / "showcase"
DATA_FILE = FRONTEND / "src" / "presentation" / "features" / "auth" / "utils" / "showcaseData.ts"
WIDTH_PX = 1200
JPEG_QUALITY = 82
CALLOUTS_PER_HOUSE = 3

# How a finish is named on its arrow; anything else uses its catalogue name.
FINISH_NAMES = {
    "paint-warm-cream": "Warm cream paint",
    "paint-sage-grey": "Sage grey paint",
    "paint-classic-white": "White paint",
    "paint-charcoal": "Charcoal paint",
    "roof-metal-sheet": "Charcoal metal roof",
    "panel-hpl-walnut": "Walnut panels",
    "stone-sandstone-ashlar": "Sandstone cladding",
}
PART_NAMES = {
    RegionLabel.WALL: "Walls",
    RegionLabel.ROOF: "Roof",
    RegionLabel.ROOF_EDGE: "Trim",
    RegionLabel.GARAGE_DOOR: "Garage door",
    RegionLabel.PILLAR: "Columns",
}


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    provider, materials, renderer = (
        PhotoSampleHouseProvider(),
        JsonMaterialRepository(),
        OpenCvPreviewRenderService(),
    )
    houses = []
    for summary in provider.samples():
        house = provider.build(summary.key)
        houses.append({"key": summary.key, **describe(house)})
        request = PreviewRequest(
            image=house.image,
            regions=house.regions,
            materials_by_region={
                region_id: material
                for region_id, material_id in house.assignments.items()
                if (material := materials.find_by_id(material_id)) is not None
            },
            facade_corners=house.scale.facade_corners,
            facade_width_ft=house.scale.facade_width_ft,
            facade_height_ft=house.scale.facade_height_ft,
        )
        for suffix, data in (("before", house.image), ("after", renderer.render(request))):
            image = decode_image(data)
            height = round(image.shape[0] * WIDTH_PX / image.shape[1])
            resized = cv2.resize(image, (WIDTH_PX, height), interpolation=cv2.INTER_AREA)
            path = OUTPUT_DIR / f"{summary.key}-{suffix}.jpg"
            cv2.imwrite(str(path), resized, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
            print(f"{path.name}  {path.stat().st_size // 1024} KB")
    write_data(houses)


def describe(house: SampleHouse) -> dict[str, object]:
    """The house's total and an arrow for each of its costliest finishes."""
    image = cv2.imdecode(np.frombuffer(house.image, np.uint8), cv2.IMREAD_COLOR)
    height, width = image.shape[:2]
    now = datetime.now(UTC)
    project = Project(
        id="showcase",
        user_id="showcase",
        name=house.name,
        created_at=now,
        updated_at=now,
        image=ProjectImage("photo.jpg", width, height, None),  # type: ignore[arg-type]
        regions=house.regions,
        scale=house.scale,
    )
    design = Design("design", "showcase", house.design_name, now, now, dict(house.assignments))
    reference, surface, _ = MeasureFacadeUseCase(OpenCvSurfaceMeasurementService()).execute(project)
    catalogue = {material.id: material for material in JsonMaterialRepository().find_all()}
    estimate = build_estimate(project, design, reference, surface, catalogue)

    owner = _owner_map(house.regions, width, height)
    lines = sorted(estimate.lines, key=lambda line: line.total, reverse=True)[:CALLOUTS_PER_HOUSE]
    callouts = []
    for line in lines:
        parts = [r for r in house.regions if house.assignments.get(r.id) == line.material_id]
        mask = np.isin(owner, [house.regions.index(r) + 1 for r in parts]).astype(np.uint8)
        # The point deepest inside the finish's visible pixels: never on a window or an edge.
        distance = cv2.distanceTransform(np.pad(mask, 1), cv2.DIST_L2, 5)[1:-1, 1:-1]
        y, x = np.unravel_index(int(np.argmax(distance)), distance.shape)
        callouts.append(
            {
                "parts": _part_names(parts),
                "finish": FINISH_NAMES.get(line.material_id, line.material_name),
                "cost": round(line.total),
                "x": round(float(x) / width, 4),
                "y": round(float(y) / height, 4),
            }
        )
    return {
        "house": house.name,
        "design": house.design_name,
        "total": round(estimate.totals.grand_total),
        "aspect": round(width / height, 4),
        "callouts": sorted(callouts, key=lambda callout: callout["x"]),
    }


def _owner_map(regions: tuple[Region, ...], width: int, height: int) -> np.ndarray:
    """Which region (1-based) each pixel shows, higher-priority parts on top, as in the estimate."""
    owner = np.zeros((height, width), np.int32)
    for region in sorted(regions, key=lambda region: region.priority):
        points = np.round(np.asarray(region.polygon)).astype(np.int32)
        cv2.fillPoly(owner, [points], regions.index(region) + 1)
    return owner


def _part_names(parts: list[Region]) -> str:
    names: list[str] = []
    for part in parts:
        name = PART_NAMES.get(part.label) or _plural(part.name)
        if name not in names:
            names.append(name)
    shown = names[:2]
    return " and ".join([shown[0], *(name.lower() for name in shown[1:])])


def _plural(name: str) -> str:
    return name if name.endswith("s") else f"{name}s"


def write_data(houses: list[dict[str, object]]) -> None:
    body = json.dumps(houses, indent=2, ensure_ascii=False)
    DATA_FILE.write_text(
        "// Generated by exterio-backend/scripts/render_showcase.py. Do not edit by hand.\n"
        "import type { ShowcaseHouse } from './showcase';\n\n"
        f"export const SHOWCASE_DATA: readonly ShowcaseHouse[] = {body};\n",
        encoding="utf-8",
    )
    print(f"{DATA_FILE.name}  {len(houses)} houses")


if __name__ == "__main__":
    main()
