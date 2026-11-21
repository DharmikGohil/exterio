"""Converts rectified pixel measurements into square feet and running feet."""

from domain.entities.region_entity import Region
from domain.interfaces.dtos.estimate_dto import RegionAreaDTO, ResolvedScaleDTO, SurfaceTotalDTO
from domain.interfaces.dtos.measurement_dto import RectifiedSurface, RegionPixels

AREA_DECIMALS = 2
EMPTY_PIXELS = RegionPixels(area_px=0.0, width_px=0.0, height_px=0.0)


def compute_region_areas(
    regions: tuple[Region, ...], surface: RectifiedSurface, scale: ResolvedScaleDTO
) -> list[RegionAreaDTO]:
    return [_region_area(region, surface, scale) for region in regions]


def _region_area(
    region: Region, surface: RectifiedSurface, scale: ResolvedScaleDTO
) -> RegionAreaDTO:
    pixels = surface.region_pixels.get(region.id, EMPTY_PIXELS)
    length_ft = pixels.width_px * scale.feet_per_pixel_x
    if region.is_linear:
        # A railing is costed by length; its area is the visible panel (length x height).
        area_sqft = length_ft * pixels.height_px * scale.feet_per_pixel_y
    else:
        area_sqft = pixels.area_px * scale.feet_per_pixel_x * scale.feet_per_pixel_y
    area_sqft *= region.surface_multiplier

    is_override = False
    if region.area_override_sqft is not None:
        area_sqft, is_override = region.area_override_sqft, True
    if region.length_override_ft is not None:
        length_ft, is_override = region.length_override_ft, True

    return RegionAreaDTO(
        region_id=region.id,
        label=region.label,
        name=region.name,
        area_sqft=round(area_sqft, AREA_DECIMALS),
        length_ft=round(length_ft, AREA_DECIMALS),
        is_override=is_override,
    )


def summarise_surfaces(areas: list[RegionAreaDTO]) -> list[SurfaceTotalDTO]:
    totals: dict[str, SurfaceTotalDTO] = {}
    for area in areas:
        current = totals.get(area.label)
        totals[area.label] = SurfaceTotalDTO(
            label=area.label,
            count=(current.count if current else 0) + 1,
            area_sqft=round(
                (current.area_sqft if current else 0.0) + area.area_sqft, AREA_DECIMALS
            ),
            length_ft=round(
                (current.length_ft if current else 0.0) + area.length_ft, AREA_DECIMALS
            ),
        )
    return list(totals.values())
