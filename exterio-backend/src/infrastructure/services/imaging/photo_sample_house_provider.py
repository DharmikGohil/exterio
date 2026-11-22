"""The demo house behind "Try it with a sample house": a real photo with its parts traced.

A real photograph shows reviewers what the product does on an actual house: the finishes follow
real siding, shadows and window frames. The parts are traced by hand and stored next to the
photo, so the sample works the same with or without AI detection. The drawn house in
`sample_house_provider` stays as ground truth for the measurement tests.

Photo: "Vibrant yellow house with white accents" by Hale Ş on Pexels (Pexels License).
"""

import json
from functools import cache
from pathlib import Path
from typing import Any

from domain.entities.region_entity import Point, Region, RegionLabel, RegionSource
from domain.entities.scale_reference_entity import ScaleMethod, ScaleReference
from domain.interfaces.services.image_services import ISampleHouseProvider, SampleHouse

ASSET_DIR = Path(__file__).parent / "sample_house"
PHOTO_PATH = ASSET_DIR / "photo.jpg"
DESCRIPTION_PATH = ASSET_DIR / "house.json"


class PhotoSampleHouseProvider(ISampleHouseProvider):
    def __init__(
        self, photo_path: Path = PHOTO_PATH, description_path: Path = DESCRIPTION_PATH
    ) -> None:
        self._photo_path = photo_path
        self._description_path = description_path

    def build(self) -> SampleHouse:
        return _load(self._photo_path, self._description_path)


@cache
def _load(photo_path: Path, description_path: Path) -> SampleHouse:
    description: dict[str, Any] = json.loads(description_path.read_text(encoding="utf-8"))
    scale = description["scale"]
    corners = tuple(_point(corner) for corner in scale["facade_corners"])
    return SampleHouse(
        image=photo_path.read_bytes(),
        regions=tuple(
            Region(
                id=f"sample-{index}",
                label=RegionLabel(item["label"]),
                name=item["name"],
                polygon=tuple(_point(point) for point in item["polygon"]),
                source=RegionSource.AUTO,
            )
            for index, item in enumerate(description["regions"], start=1)
        ),
        scale=ScaleReference(
            method=ScaleMethod.FACADE_DIMENSIONS,
            facade_corners=(corners[0], corners[1], corners[2], corners[3]),
            facade_width_ft=float(scale["facade_width_ft"]),
            facade_height_ft=float(scale["facade_height_ft"]),
            storeys=int(scale["storeys"]),
        ),
        material_by_label={
            RegionLabel(label): material for label, material in description["materials"].items()
        },
    )


def _point(raw: list[float]) -> Point:
    return (float(raw[0]), float(raw[1]))
