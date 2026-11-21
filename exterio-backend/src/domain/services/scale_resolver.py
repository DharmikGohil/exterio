"""Turns a scale reference into feet-per-pixel on the rectified facade.

Area scales with the square of length, so a linear error of e% becomes an
area error of roughly 2e%. The confidence band reported to the user is that
area figure, and it depends on how trustworthy the chosen reference is.
"""

from domain.entities.region_entity import Region, RegionLabel
from domain.entities.scale_reference_entity import (
    DEFAULT_STOREY_HEIGHT_FT,
    ScaleMethod,
    ScaleReference,
)
from domain.errors.project_errors import InvalidScaleError
from domain.interfaces.dtos.estimate_dto import ResolvedScaleDTO
from domain.interfaces.dtos.measurement_dto import RectifiedSurface

AREA_ERROR_FACTOR = 2.0

LINEAR_UNCERTAINTY_PCT: dict[ScaleMethod, float] = {
    ScaleMethod.FACADE_DIMENSIONS: 4.0,
    ScaleMethod.REFERENCE_LINE: 6.0,
    ScaleMethod.DOOR_HEIGHT: 10.0,
    ScaleMethod.STOREY_HEIGHT: 15.0,
}


def resolve_scale(
    scale: ScaleReference, surface: RectifiedSurface, regions: tuple[Region, ...]
) -> ResolvedScaleDTO:
    """Use the requested method; if its inputs are missing, fall back to door then storey."""
    if surface.facade_width_px <= 0 or surface.facade_height_px <= 0:
        raise InvalidScaleError("The facade outline has no area. Adjust the four corners.")

    requested = _resolve_requested(scale, surface, regions)
    if requested is not None:
        return requested

    fallback = _from_door_height(scale, surface, regions) or _from_storey_height(scale, surface)
    note = f"The chosen method needs more information, so a fallback was used. {fallback.note}"
    return ResolvedScaleDTO(
        fallback.method,
        fallback.feet_per_pixel_x,
        fallback.feet_per_pixel_y,
        fallback.confidence_pct,
        note,
    )


def _resolve_requested(
    scale: ScaleReference, surface: RectifiedSurface, regions: tuple[Region, ...]
) -> ResolvedScaleDTO | None:
    if scale.method == ScaleMethod.FACADE_DIMENSIONS:
        return _from_facade_dimensions(scale, surface)
    if scale.method == ScaleMethod.REFERENCE_LINE:
        return _from_reference_line(scale, surface)
    if scale.method == ScaleMethod.DOOR_HEIGHT:
        return _from_door_height(scale, surface, regions)
    return _from_storey_height(scale, surface)


def _build(method: ScaleMethod, feet_x: float, feet_y: float, note: str) -> ResolvedScaleDTO:
    confidence = LINEAR_UNCERTAINTY_PCT[method] * AREA_ERROR_FACTOR
    return ResolvedScaleDTO(method, feet_x, feet_y, confidence, note)


def _from_facade_dimensions(
    scale: ScaleReference, surface: RectifiedSurface
) -> ResolvedScaleDTO | None:
    if not scale.facade_width_ft or not scale.facade_height_ft:
        return None
    note = (
        f"Scale set from the wall size you entered "
        f"({scale.facade_width_ft:g} ft wide by {scale.facade_height_ft:g} ft high)."
    )
    return _build(
        ScaleMethod.FACADE_DIMENSIONS,
        scale.facade_width_ft / surface.facade_width_px,
        scale.facade_height_ft / surface.facade_height_px,
        note,
    )


def _from_reference_line(
    scale: ScaleReference, surface: RectifiedSurface
) -> ResolvedScaleDTO | None:
    if not scale.reference_length_ft or not surface.reference_line_px:
        return None
    feet_per_px = scale.reference_length_ft / surface.reference_line_px
    note = f"Scale set from a measurement you marked ({scale.reference_length_ft:g} ft)."
    return _build(ScaleMethod.REFERENCE_LINE, feet_per_px, feet_per_px, note)


def _from_door_height(
    scale: ScaleReference, surface: RectifiedSurface, regions: tuple[Region, ...]
) -> ResolvedScaleDTO | None:
    door_heights = [
        surface.region_pixels[region.id].height_px
        for region in regions
        if region.label == RegionLabel.DOOR and region.id in surface.region_pixels
    ]
    tallest = max(door_heights, default=0.0)
    if tallest <= 0 or scale.door_height_ft <= 0:
        return None
    feet_per_px = scale.door_height_ft / tallest
    note = f"Scale assumes the door is {scale.door_height_ft:g} ft tall."
    return _build(ScaleMethod.DOOR_HEIGHT, feet_per_px, feet_per_px, note)


def _from_storey_height(scale: ScaleReference, surface: RectifiedSurface) -> ResolvedScaleDTO:
    storeys = max(scale.storeys, 1)
    feet_per_px = storeys * DEFAULT_STOREY_HEIGHT_FT / surface.facade_height_px
    note = (
        f"Scale assumes {storeys} storey(s) of {DEFAULT_STOREY_HEIGHT_FT:g} ft each. "
        "Add a real measurement for a tighter estimate."
    )
    return _build(ScaleMethod.STOREY_HEIGHT, feet_per_px, feet_per_px, note)
