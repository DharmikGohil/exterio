"""Perspective geometry for a planar facade seen in a single photo.

Two problems are solved here:

1. Rectification. Four corners of the facade define a homography that maps the
   photo onto a flat, front-on view where pixel counts are proportional to area.

2. Aspect ratio. A homography alone does not say how wide the rectangle is
   relative to its height. When the user has not typed both dimensions, the
   ratio is recovered from the corners with the method of Zhang and He
   ("Whiteboard scanning and image enhancement", 2007), which assumes square
   pixels and a principal point at the image centre. That method needs two
   finite vanishing points. A phone held level gives parallel verticals, so in
   that case a typical phone focal length is assumed instead.
"""

from dataclasses import dataclass

import cv2
import numpy as np
from numpy.typing import NDArray

from domain.entities.region_entity import Point

Matrix = NDArray[np.float64]

# Main phone cameras are about 24-26 mm equivalent: focal length ~0.75 x long side in pixels.
DEFAULT_FOCAL_RATIO = 0.75
MIN_FOCAL_RATIO = 0.3
MAX_FOCAL_RATIO = 5.0
MIN_VANISHING_TERM = 0.02
MIN_ASPECT_RATIO = 0.1
MAX_ASPECT_RATIO = 10.0
HORIZON_EPSILON = 1e-3
# Regions outside the facade outline are kept, up to this many facade sizes away.
CANVAS_MARGIN = 1.5


@dataclass(frozen=True)
class Rectification:
    """Homography from photo pixels to a rectified canvas, plus that canvas's layout."""

    homography: Matrix
    facade_width_px: float
    facade_height_px: float

    @property
    def bounds(self) -> tuple[float, float, float, float]:
        """Clip window (min_x, min_y, max_x, max_y) in rectified coordinates."""
        return (
            -CANVAS_MARGIN * self.facade_width_px,
            -CANVAS_MARGIN * self.facade_height_px,
            (1 + CANVAS_MARGIN) * self.facade_width_px,
            (1 + CANVAS_MARGIN) * self.facade_height_px,
        )

    def transform(self, points: tuple[Point, ...] | list[Point]) -> NDArray[np.float64]:
        """Map photo points to rectified coordinates, clamped to the clip window.

        Points at or beyond the plane's horizon would project to infinity or flip
        sign, so their depth term is clamped before dividing.
        """
        source = np.asarray(points, dtype=np.float64)
        homogeneous = np.hstack([source, np.ones((len(source), 1))]) @ self.homography.T
        depth = homogeneous[:, 2]
        reference = np.sign(self.homography[2, 2]) or 1.0
        depth = np.where(depth * reference < HORIZON_EPSILON, reference * HORIZON_EPSILON, depth)
        projected = homogeneous[:, :2] / depth[:, None]
        min_x, min_y, max_x, max_y = self.bounds
        projected[:, 0] = np.clip(projected[:, 0], min_x, max_x)
        projected[:, 1] = np.clip(projected[:, 1], min_y, max_y)
        return projected


def edge_aspect_ratio(corners: tuple[Point, Point, Point, Point]) -> float:
    """Width / height from average edge lengths. Exact only for a front-on view."""
    tl, tr, br, bl = (np.asarray(corner, dtype=np.float64) for corner in corners)
    width = (np.linalg.norm(tr - tl) + np.linalg.norm(br - bl)) / 2
    height = (np.linalg.norm(bl - tl) + np.linalg.norm(br - tr)) / 2
    return float(width / max(height, 1e-9))


def estimate_aspect_ratio(
    corners: tuple[Point, Point, Point, Point], image_width: int, image_height: int
) -> float:
    """Recover the true width / height of a rectangle from its four image corners."""
    centre = np.array([image_width / 2, image_height / 2])
    tl, tr, br, bl = (np.append(np.asarray(c, dtype=np.float64) - centre, 1.0) for c in corners)
    denominator_2 = float(np.dot(np.cross(tr, br), bl))
    denominator_3 = float(np.dot(np.cross(bl, br), tr))
    if abs(denominator_2) < 1e-9 or abs(denominator_3) < 1e-9:
        return _clamp_ratio(edge_aspect_ratio(corners))

    k2 = float(np.dot(np.cross(tl, br), bl)) / denominator_2
    k3 = float(np.dot(np.cross(tl, br), tr)) / denominator_3
    n2 = k2 * tr - tl  # along the width
    n3 = k3 * bl - tl  # along the height

    long_side = max(image_width, image_height)
    focal_squared = (DEFAULT_FOCAL_RATIO * long_side) ** 2
    if abs(n2[2]) > MIN_VANISHING_TERM and abs(n3[2]) > MIN_VANISHING_TERM:
        recovered = -(n2[0] * n3[0] + n2[1] * n3[1]) / (n2[2] * n3[2])
        lower, upper = (MIN_FOCAL_RATIO * long_side) ** 2, (MAX_FOCAL_RATIO * long_side) ** 2
        if lower <= recovered <= upper:
            focal_squared = float(recovered)

    width_term = (n2[0] ** 2 + n2[1] ** 2) / focal_squared + n2[2] ** 2
    height_term = (n3[0] ** 2 + n3[1] ** 2) / focal_squared + n3[2] ** 2
    if height_term <= 0:
        return _clamp_ratio(edge_aspect_ratio(corners))
    return _clamp_ratio(float(np.sqrt(width_term / height_term)))


def _clamp_ratio(ratio: float) -> float:
    if not np.isfinite(ratio):
        return 1.0
    return float(min(max(ratio, MIN_ASPECT_RATIO), MAX_ASPECT_RATIO))


def build_rectification(
    corners: tuple[Point, Point, Point, Point],
    image_width: int,
    image_height: int,
    aspect_ratio: float | None,
    facade_height_px: float,
) -> Rectification:
    """Homography that maps the facade outline onto a rectangle of the given height."""
    ratio = aspect_ratio or estimate_aspect_ratio(corners, image_width, image_height)
    facade_width_px = facade_height_px * _clamp_ratio(ratio)
    source = np.asarray(corners, dtype=np.float32)
    target = np.array(
        [
            [0, 0],
            [facade_width_px, 0],
            [facade_width_px, facade_height_px],
            [0, facade_height_px],
        ],
        dtype=np.float32,
    )
    homography = cv2.getPerspectiveTransform(source, target).astype(np.float64)
    return Rectification(homography, float(facade_width_px), float(facade_height_px))
