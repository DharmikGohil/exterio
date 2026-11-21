"""Pixel measurements of the facade after perspective has been removed."""

from dataclasses import dataclass


@dataclass(frozen=True)
class RegionPixels:
    """Size of one region in the rectified (front-on) view, in pixels."""

    area_px: float
    width_px: float
    height_px: float


@dataclass(frozen=True)
class RectifiedSurface:
    facade_width_px: float
    facade_height_px: float
    region_pixels: dict[str, RegionPixels]
    reference_line_px: float | None = None
