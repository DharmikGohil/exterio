"""Business rules for regions and scale references supplied by the user."""

from domain.entities.region_entity import MIN_POLYGON_POINTS, Point
from domain.entities.scale_reference_entity import ScaleMethod, ScaleReference
from domain.errors.project_errors import InvalidRegionError, InvalidScaleError
from domain.interfaces.dtos.project_dto import RegionInputDTO

MAX_REGIONS = 200
MIN_MULTIPLIER = 0.1
MAX_MULTIPLIER = 10.0
MAX_NAME_LENGTH = 60
MIN_FACADE_AREA_RATIO = 0.01


def clamp_point(point: Point, width: int, height: int) -> Point:
    return (min(max(point[0], 0.0), float(width)), min(max(point[1], 0.0), float(height)))


def validate_region_inputs(regions: list[RegionInputDTO]) -> None:
    if len(regions) > MAX_REGIONS:
        raise InvalidRegionError(f"A project can have at most {MAX_REGIONS} regions")
    for region in regions:
        if len(region.polygon) < MIN_POLYGON_POINTS:
            raise InvalidRegionError(f"'{region.name}' needs at least {MIN_POLYGON_POINTS} points")
        if not region.name.strip() or len(region.name) > MAX_NAME_LENGTH:
            raise InvalidRegionError("Each region needs a name of up to 60 characters")
        if not MIN_MULTIPLIER <= region.surface_multiplier <= MAX_MULTIPLIER:
            raise InvalidRegionError(
                f"Surface multiplier for '{region.name}' must be between "
                f"{MIN_MULTIPLIER:g} and {MAX_MULTIPLIER:g}"
            )
        for value in (region.area_override_sqft, region.length_override_ft):
            if value is not None and value < 0:
                raise InvalidRegionError(f"Measurements for '{region.name}' cannot be negative")


def polygon_area(points: tuple[Point, ...]) -> float:
    """Shoelace formula."""
    total = 0.0
    for index, (x1, y1) in enumerate(points):
        x2, y2 = points[(index + 1) % len(points)]
        total += x1 * y2 - x2 * y1
    return abs(total) / 2


def validate_scale(scale: ScaleReference, width: int, height: int) -> None:
    if polygon_area(scale.facade_corners) < MIN_FACADE_AREA_RATIO * width * height:
        raise InvalidScaleError(
            "The facade outline is too small. Drag the corners to the wall edges."
        )
    if scale.method == ScaleMethod.FACADE_DIMENSIONS and (
        not scale.facade_width_ft
        or not scale.facade_height_ft
        or scale.facade_width_ft <= 0
        or scale.facade_height_ft <= 0
    ):
        raise InvalidScaleError("Enter the wall width and height in feet")
    if scale.method == ScaleMethod.REFERENCE_LINE and (
        scale.reference_line is None
        or not scale.reference_length_ft
        or scale.reference_length_ft <= 0
        or scale.reference_line[0] == scale.reference_line[1]
    ):
        raise InvalidScaleError("Mark a line on the photo and enter its real length in feet")
    if scale.method == ScaleMethod.DOOR_HEIGHT and scale.door_height_ft <= 0:
        raise InvalidScaleError("Door height must be greater than zero")
    if scale.method == ScaleMethod.STOREY_HEIGHT and scale.storeys < 1:
        raise InvalidScaleError("Number of storeys must be at least 1")
