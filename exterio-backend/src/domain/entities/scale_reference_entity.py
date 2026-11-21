"""Scale reference: how pixels in the photo are converted to real-world feet."""

from dataclasses import dataclass
from enum import StrEnum

from domain.entities.region_entity import Point

DEFAULT_DOOR_HEIGHT_FT = 7.0
DEFAULT_STOREY_HEIGHT_FT = 10.0
FACADE_CORNER_COUNT = 4


class ScaleMethod(StrEnum):
    FACADE_DIMENSIONS = "facade_dimensions"
    REFERENCE_LINE = "reference_line"
    DOOR_HEIGHT = "door_height"
    STOREY_HEIGHT = "storey_height"


@dataclass(frozen=True)
class ScaleReference:
    """Facade corners are ordered top-left, top-right, bottom-right, bottom-left."""

    method: ScaleMethod
    facade_corners: tuple[Point, Point, Point, Point]
    reference_line: tuple[Point, Point] | None = None
    reference_length_ft: float | None = None
    facade_width_ft: float | None = None
    facade_height_ft: float | None = None
    storeys: int = 1
    door_height_ft: float = DEFAULT_DOOR_HEIGHT_FT
