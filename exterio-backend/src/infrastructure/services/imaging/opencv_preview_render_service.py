"""Instant material preview: textures composited onto the photo.

For each material the pipeline is:

1. Tile its texture at real-world size on a flat, front-on canvas.
2. Warp that canvas back into the photo with the inverse facade homography,
   so courses and joints follow the wall's perspective.
3. Multiply by the photo's own low-frequency lightness, so existing shadows
   (under a balcony, beside a pillar) survive the change of finish.
4. Blend inside the region mask only, with a soft edge.

Pixels outside the chosen regions are never touched, which is how the original
building structure is preserved.
"""

import cv2
import numpy as np
from numpy.typing import NDArray

from domain.entities.material_entity import Material, MaterialUnit
from domain.entities.region_entity import Region
from domain.interfaces.services.image_services import IPreviewRenderService, PreviewRequest
from infrastructure.services.imaging.image_codec import (
    decode_image,
    encode_jpeg,
    encode_png,
    hex_to_bgr,
)
from infrastructure.services.imaging.perspective import build_rectification
from infrastructure.services.imaging.texture_factory import material_tile

MAX_PIXELS_PER_FOOT = 40.0
MAX_FACADE_PX = 1400.0
MIN_TILE_PX = 12
MAX_TILE_PX = 1024
MAX_CANVAS_PX = 4096
SHADE_MIN = 0.45
SHADE_MAX = 1.35
SHADE_BLUR_RATIO = 0.006
EDGE_FEATHER_PX = 3
MERGE_DILATE_PX = 5
MERGE_FEATHER_PX = 9
SWATCH_BACKGROUND = (0.86, 0.9, 0.93)
RAIL_COLOR_SCALE = 0.85
RAIL_THICKNESS_RATIO = 0.004


class OpenCvPreviewRenderService(IPreviewRenderService):
    def render(self, request: PreviewRequest) -> bytes:
        image = decode_image(request.image)
        height, width = image.shape[:2]
        label_map, ordered = self._label_map(request.regions, width, height)
        lightness = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)[:, :, 0].astype(np.float32) / 255.0
        sigma = max(width * SHADE_BLUR_RATIO, 1.5)
        output = image.astype(np.float32) / 255.0

        for material, region_ids in self._group_by_material(request).items():
            indices = [index for index, region in enumerate(ordered, 1) if region.id in region_ids]
            mask = np.isin(label_map, indices)
            if not mask.any():
                continue
            texture = self._texture_in_photo(material, request, width, height)
            relative = self._relative_shade(lightness, mask, sigma)
            lit = np.clip(texture[:, :, :3] * relative[..., None], 0, 1)
            alpha = self._feather(mask) * texture[:, :, 3] * material.texture.opacity
            output = output * (1 - alpha[..., None]) + lit * alpha[..., None]
            if material.unit == MaterialUnit.RFT:
                self._draw_top_rails(output, [ordered[index - 1] for index in indices], material)

        return encode_jpeg(np.clip(output * 255, 0, 255).astype(np.uint8))

    def merge_with_original(
        self,
        original: bytes,
        edited: bytes,
        regions: tuple[Region, ...],
        edited_ids: frozenset[str],
    ) -> bytes:
        base = decode_image(original)
        height, width = base.shape[:2]
        generated = cv2.resize(
            decode_image(edited), (width, height), interpolation=cv2.INTER_LANCZOS4
        )
        label_map, ordered = self._label_map(regions, width, height)
        indices = [index for index, region in enumerate(ordered, 1) if region.id in edited_ids]
        mask = np.isin(label_map, indices).astype(np.uint8)
        kernel = np.ones((MERGE_DILATE_PX, MERGE_DILATE_PX), np.uint8)
        alpha = cv2.GaussianBlur(
            cv2.dilate(mask, kernel).astype(np.float32), (MERGE_FEATHER_PX, MERGE_FEATHER_PX), 0
        )[..., None]
        merged = base.astype(np.float32) * (1 - alpha) + generated.astype(np.float32) * alpha
        return encode_jpeg(np.clip(merged, 0, 255).astype(np.uint8))

    def swatch(self, material: Material, size: int) -> bytes:
        tile = material_tile(material, size)
        background = np.full((size, size, 3), SWATCH_BACKGROUND, dtype=np.float32)
        alpha = (tile[:, :, 3] * material.texture.opacity)[..., None]
        image = background * (1 - alpha) + tile[:, :, :3] * alpha
        return encode_png(np.clip(image * 255, 0, 255).astype(np.uint8))

    @staticmethod
    def _label_map(
        regions: tuple[Region, ...], width: int, height: int
    ) -> tuple[NDArray[np.int32], list[Region]]:
        """Region index per pixel; higher-priority regions overwrite lower ones."""
        ordered = sorted(regions, key=lambda region: region.priority)
        label_map = np.zeros((height, width), dtype=np.int32)
        for index, region in enumerate(ordered, start=1):
            polygon = np.round(np.asarray(region.polygon, dtype=np.float64)).astype(np.int32)
            cv2.fillPoly(label_map, [polygon], index)
        return label_map, ordered

    @staticmethod
    def _relative_shade(
        lightness: NDArray[np.float32], mask: NDArray[np.bool_], sigma: float
    ) -> NDArray[np.float32]:
        """How much lighter or darker each pixel is than the surface's typical lightness.

        The blur keeps soft shadows and drops the old surface texture. It is
        normalised by the blurred mask so that only pixels inside the region
        contribute; otherwise dark windows would bleed a halo onto the wall.
        """
        weights = mask.astype(np.float32)
        blurred = cv2.GaussianBlur(lightness * weights, (0, 0), sigma)
        coverage = cv2.GaussianBlur(weights, (0, 0), sigma)
        local = np.where(coverage > 1e-3, blurred / np.maximum(coverage, 1e-3), 1.0)
        typical = max(float(np.median(lightness[mask])), 1e-3)
        return np.clip(local / typical, SHADE_MIN, SHADE_MAX).astype(np.float32)

    @staticmethod
    def _feather(mask: NDArray[np.bool_]) -> NDArray[np.float32]:
        size = EDGE_FEATHER_PX * 2 + 1
        return cv2.GaussianBlur(mask.astype(np.float32), (size, size), 0).astype(np.float32)

    @staticmethod
    def _group_by_material(request: PreviewRequest) -> dict[Material, set[str]]:
        groups: dict[Material, set[str]] = {}
        for region_id, material in request.materials_by_region.items():
            groups.setdefault(material, set()).add(region_id)
        return groups

    @staticmethod
    def _texture_in_photo(
        material: Material, request: PreviewRequest, width: int, height: int
    ) -> NDArray[np.float32]:
        """The material's texture as it would appear on the facade plane in the photo."""
        if material.texture.pattern == "flat":
            flat = np.ones((height, width, 4), dtype=np.float32)
            flat[:, :, :3] = hex_to_bgr(material.color_hex)
            return flat

        pixels_per_foot = min(
            MAX_PIXELS_PER_FOOT,
            MAX_FACADE_PX / max(request.facade_width_ft, 1e-3),
            MAX_FACADE_PX / max(request.facade_height_ft, 1e-3),
        )
        rectification = build_rectification(
            request.facade_corners,
            width,
            height,
            request.facade_width_ft / max(request.facade_height_ft, 1e-3),
            request.facade_height_ft * pixels_per_foot,
        )
        min_x, min_y, max_x, max_y = rectification.bounds
        canvas_width = int(min(max_x - min_x, MAX_CANVAS_PX))
        canvas_height = int(min(max_y - min_y, MAX_CANVAS_PX))

        tile_px = int(
            np.clip(material.texture.tile_size_ft * pixels_per_foot, MIN_TILE_PX, MAX_TILE_PX)
        )
        tile = material_tile(material, tile_px)
        repeats = (canvas_height // tile_px + 2, canvas_width // tile_px + 2, 1)
        canvas = np.tile(tile, repeats)[:canvas_height, :canvas_width]

        to_canvas = np.array([[1, 0, -min_x], [0, 1, -min_y], [0, 0, 1]], dtype=np.float64)
        photo_to_canvas = to_canvas @ rectification.homography
        return cv2.warpPerspective(
            canvas,
            photo_to_canvas,
            (width, height),
            flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
            borderMode=cv2.BORDER_REFLECT,
        ).astype(np.float32)

    @staticmethod
    def _draw_top_rails(
        output: NDArray[np.float32], regions: list[Region], material: Material
    ) -> None:
        """A railing needs a handrail: draw one along the top edge of each railing region."""
        blue, green, red = hex_to_bgr(material.texture.secondary_color_hex or material.color_hex)
        color = (blue * RAIL_COLOR_SCALE, green * RAIL_COLOR_SCALE, red * RAIL_COLOR_SCALE)
        thickness = max(int(output.shape[1] * RAIL_THICKNESS_RATIO), 2)
        for region in regions:
            points = np.asarray(region.polygon, dtype=np.float64)
            edges = list(zip(points, np.roll(points, -1, axis=0), strict=True))
            flat_edges = [
                (start, end)
                for start, end in edges
                if abs(end[0] - start[0]) >= abs(end[1] - start[1])
            ]
            if not flat_edges:
                continue
            start, end = min(flat_edges, key=lambda edge: edge[0][1] + edge[1][1])
            cv2.line(
                output,
                (round(start[0]), round(start[1])),
                (round(end[0]), round(end[1])),
                color,
                thickness,
                cv2.LINE_AA,
            )
