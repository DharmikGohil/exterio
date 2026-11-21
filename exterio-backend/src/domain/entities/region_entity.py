"""Region entity: one labelled surface of the building, stored as a polygon."""

from dataclasses import dataclass
from enum import StrEnum

Point = tuple[float, float]

MIN_POLYGON_POINTS = 3


class RegionLabel(StrEnum):
    WALL = "wall"
    WINDOW = "window"
    DOOR = "door"
    BALCONY = "balcony"
    PILLAR = "pillar"
    PARAPET = "parapet"
    GATE = "gate"
    ROOF_EDGE = "roof_edge"
    RAILING = "railing"
    ROOF = "roof"
    CHIMNEY = "chimney"
    GARAGE_DOOR = "garage_door"
    FENCE = "fence"
    # Anything else a homeowner might refinish (solar panels, a water tank, entrance steps).
    # The detector names it; it is measured and priced by area like a wall.
    OTHER = "other"


class RegionSource(StrEnum):
    AUTO = "auto"
    USER = "user"


# Higher number wins when two regions overlap. A window drawn on top of a wall
# removes that area from the wall, so openings are never painted or costed.
REGION_PRIORITY: dict[RegionLabel, int] = {
    RegionLabel.WALL: 1,
    RegionLabel.ROOF: 2,
    RegionLabel.FENCE: 2,
    RegionLabel.ROOF_EDGE: 3,
    RegionLabel.PARAPET: 4,
    RegionLabel.OTHER: 5,
    RegionLabel.CHIMNEY: 6,
    RegionLabel.BALCONY: 7,
    RegionLabel.PILLAR: 8,
    RegionLabel.GATE: 9,
    RegionLabel.GARAGE_DOOR: 10,
    RegionLabel.RAILING: 11,
    RegionLabel.DOOR: 12,
    RegionLabel.WINDOW: 13,
}

# Openings are detected so they can be subtracted and used as scale references,
# but no finish is applied to them.
OPENING_LABELS: frozenset[RegionLabel] = frozenset({RegionLabel.WINDOW, RegionLabel.DOOR})

# Regions measured by running length rather than by area.
LINEAR_LABELS: frozenset[RegionLabel] = frozenset({RegionLabel.RAILING})


@dataclass(frozen=True)
class Region:
    id: str
    label: RegionLabel
    name: str
    polygon: tuple[Point, ...]
    source: RegionSource = RegionSource.USER
    surface_multiplier: float = 1.0
    area_override_sqft: float | None = None
    length_override_ft: float | None = None

    @property
    def priority(self) -> int:
        return REGION_PRIORITY[self.label]

    @property
    def is_opening(self) -> bool:
        return self.label in OPENING_LABELS

    @property
    def is_linear(self) -> bool:
        return self.label in LINEAR_LABELS
