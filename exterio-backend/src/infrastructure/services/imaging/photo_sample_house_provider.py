"""The demo houses behind "Try it with a sample house": real photos with their parts traced.

Real photographs show what the product does on actual houses: finishes follow real siding, brick,
frames and shadows. Each house's parts are traced by hand and stored next to its photo
(`sample_houses/<key>/house.json`), so the samples work the same with or without AI detection.
The drawn house in `sample_house_provider` stays as ground truth for the measurement tests.

Every photo is from Pexels, under the Pexels License; each house.json names its photographer.
"""

import json
from functools import cache
from pathlib import Path
from typing import Any

from domain.entities.region_entity import Point, Region, RegionLabel, RegionSource
from domain.entities.scale_reference_entity import ScaleMethod, ScaleReference
from domain.interfaces.services.image_services import (
    ISampleHouseProvider,
    SampleHouse,
    SampleHouseSummary,
    SampleStage,
)

SAMPLES_DIR = Path(__file__).parent / "sample_houses"
# The order they are offered in; the first is the default sample.
SAMPLE_KEYS = ("ranch", "two-storey", "brick", "craftsman")


class PhotoSampleHouseProvider(ISampleHouseProvider):
    def __init__(
        self, samples_dir: Path = SAMPLES_DIR, keys: tuple[str, ...] = SAMPLE_KEYS
    ) -> None:
        self._samples_dir = samples_dir
        self._keys = keys

    def samples(self) -> tuple[SampleHouseSummary, ...]:
        return tuple(
            SampleHouseSummary(key=key, name=_description(self._samples_dir / key)["name"])
            for key in self._keys
        )

    def build(self, key: str | None = None) -> SampleHouse:
        chosen = key if key in self._keys else self._keys[0]
        return _load(self._samples_dir / chosen)


@cache
def _description(folder: Path) -> dict[str, Any]:
    result: dict[str, Any] = json.loads((folder / "house.json").read_text(encoding="utf-8"))
    return result


@cache
def _load(folder: Path) -> SampleHouse:
    description = _description(folder)
    scale = description["scale"]
    corners = tuple(_point(corner) for corner in scale["facade_corners"])
    by_label: dict[str, str] = description["materials"]
    regions = []
    assignments: dict[str, str] = {}
    for index, item in enumerate(description["regions"], start=1):
        region = Region(
            id=f"sample-{index}",
            label=RegionLabel(item["label"]),
            name=item["name"],
            polygon=tuple(_point(point) for point in item["polygon"]),
            source=RegionSource.AUTO,
        )
        regions.append(region)
        # A part may name its own finish (stone stays stone); otherwise its kind decides.
        material = item.get("material", by_label.get(item["label"]))
        if material:
            assignments[region.id] = material
    return SampleHouse(
        name=description["name"],
        design_name=description["design_name"],
        image=(folder / "photo.jpg").read_bytes(),
        regions=tuple(regions),
        scale=ScaleReference(
            method=ScaleMethod.FACADE_DIMENSIONS,
            facade_corners=(corners[0], corners[1], corners[2], corners[3]),
            facade_width_ft=float(scale["facade_width_ft"]),
            facade_height_ft=float(scale["facade_height_ft"]),
            storeys=int(scale["storeys"]),
        ),
        assignments=assignments,
        stage=SampleStage(description.get("stage", SampleStage.FINISHED)),
    )


def _point(raw: list[float]) -> Point:
    return (float(raw[0]), float(raw[1]))
