"""Measures every region on the rectified facade by counting pixels."""

import cv2
import numpy as np

from domain.entities.region_entity import Point, Region
from domain.interfaces.dtos.measurement_dto import RectifiedSurface, RegionPixels
from domain.interfaces.services.image_services import ISurfaceMeasurementService
from infrastructure.services.imaging.perspective import Rectification, build_rectification

# Height of the facade in the rectified canvas. Sub-pixel accuracy is not needed:
# at 700 px a 20 ft wall resolves to about a third of an inch.
MEASUREMENT_HEIGHT_PX = 700.0


class OpenCvSurfaceMeasurementService(ISurfaceMeasurementService):
    def measure(
        self,
        width: int,
        height: int,
        regions: tuple[Region, ...],
        facade_corners: tuple[Point, Point, Point, Point],
        reference_line: tuple[Point, Point] | None,
        known_aspect_ratio: float | None,
    ) -> RectifiedSurface:
        rectification = build_rectification(
            facade_corners, width, height, known_aspect_ratio, MEASUREMENT_HEIGHT_PX
        )
        reference_line_px = None
        if reference_line is not None:
            start, end = rectification.transform(reference_line)
            reference_line_px = float(np.linalg.norm(end - start))
        return RectifiedSurface(
            facade_width_px=rectification.facade_width_px,
            facade_height_px=rectification.facade_height_px,
            region_pixels=self._measure_regions(regions, rectification),
            reference_line_px=reference_line_px,
        )

    @staticmethod
    def _measure_regions(
        regions: tuple[Region, ...], rectification: Rectification
    ) -> dict[str, RegionPixels]:
        """Paint regions onto one label map, lowest priority first.

        Higher-priority regions overwrite lower ones, so a window drawn over a
        wall removes its pixels from the wall without any polygon clipping.
        """
        if not regions:
            return {}
        min_x, min_y, max_x, max_y = rectification.bounds
        canvas = np.zeros((int(max_y - min_y) + 1, int(max_x - min_x) + 1), dtype=np.int32)
        offset = np.array([min_x, min_y])

        ordered = sorted(regions, key=lambda region: region.priority)
        polygons = [rectification.transform(region.polygon) for region in ordered]
        for index, polygon in enumerate(polygons, start=1):
            cv2.fillPoly(canvas, [np.round(polygon - offset).astype(np.int32)], index)
        counts = np.bincount(canvas.ravel(), minlength=len(ordered) + 1)

        result: dict[str, RegionPixels] = {}
        for index, (region, polygon) in enumerate(zip(ordered, polygons, strict=True), start=1):
            extent = polygon.max(axis=0) - polygon.min(axis=0)
            result[region.id] = RegionPixels(
                area_px=float(counts[index]), width_px=float(extent[0]), height_px=float(extent[1])
            )
        return result
