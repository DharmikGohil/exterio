"""Sensible scale reference for a project whose owner has not set one yet."""

from domain.entities.region_entity import Point, Region, RegionLabel
from domain.entities.scale_reference_entity import ScaleMethod, ScaleReference

DEFAULT_STOREYS = 2
IMAGE_INSET_RATIO = 0.1


def default_facade_corners(
    regions: tuple[Region, ...], width: int, height: int
) -> tuple[Point, Point, Point, Point]:
    wall_points = [
        point for region in regions if region.label == RegionLabel.WALL for point in region.polygon
    ]
    if wall_points:
        left = min(x for x, _ in wall_points)
        right = max(x for x, _ in wall_points)
        top = min(y for _, y in wall_points)
        bottom = max(y for _, y in wall_points)
    else:
        left, right = width * IMAGE_INSET_RATIO, width * (1 - IMAGE_INSET_RATIO)
        top, bottom = height * IMAGE_INSET_RATIO, height * (1 - IMAGE_INSET_RATIO)
    return ((left, top), (right, top), (right, bottom), (left, bottom))


def default_scale_reference(regions: tuple[Region, ...], width: int, height: int) -> ScaleReference:
    has_door = any(region.label == RegionLabel.DOOR for region in regions)
    return ScaleReference(
        method=ScaleMethod.DOOR_HEIGHT if has_door else ScaleMethod.STOREY_HEIGHT,
        facade_corners=default_facade_corners(regions, width, height),
        storeys=DEFAULT_STOREYS,
    )
