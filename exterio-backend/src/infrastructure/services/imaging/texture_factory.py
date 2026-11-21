"""Procedural, seamlessly tiling material textures.

Every texture is generated with NumPy, so the catalogue needs no image assets
and has no licensing questions. A tile is a float32 BGRA array in 0..1; the
alpha channel lets railings show the scene behind them.
"""

from collections.abc import Callable
from functools import lru_cache
from itertools import pairwise

import cv2
import numpy as np
from numpy.typing import NDArray

from domain.entities.material_entity import Material
from infrastructure.services.imaging.image_codec import hex_to_bgr

Tile = NDArray[np.float32]

BASE_SIZE = 384
SEED = 7
OPAQUE = 1.0


def _canvas(color: tuple[float, float, float]) -> Tile:
    tile = np.ones((BASE_SIZE, BASE_SIZE, 4), dtype=np.float32)
    tile[:, :, :3] = color
    return tile


def _wrap_blur(values: NDArray[np.float32], sigma_x: float, sigma_y: float) -> NDArray[np.float32]:
    """Gaussian blur that wraps around the edges, so the result still tiles seamlessly.

    OpenCV's blur has no wrap border mode, so the array is padded with wrapped
    copies of itself, blurred, and cropped back.
    """
    pad_x, pad_y = int(sigma_x * 3) + 1, int(sigma_y * 3) + 1
    padded = np.pad(values, ((pad_y, pad_y), (pad_x, pad_x)), mode="wrap")
    blurred = cv2.GaussianBlur(padded, (0, 0), sigmaX=sigma_x, sigmaY=sigma_y)
    return blurred[pad_y : pad_y + values.shape[0], pad_x : pad_x + values.shape[1]].astype(
        np.float32
    )


def _seamless_noise(rng: np.random.Generator, sigma: float) -> NDArray[np.float32]:
    """Smooth noise in -1..1 that wraps cleanly at the tile edges."""
    noise = rng.standard_normal((BASE_SIZE, BASE_SIZE)).astype(np.float32)
    blurred = _wrap_blur(noise, sigma, sigma)
    peak = float(np.abs(blurred).max()) or 1.0
    return (blurred / peak).astype(np.float32)


def _shade(tile: Tile, amount: NDArray[np.float32] | float) -> None:
    """Multiply the colour channels by (1 + amount), in place."""
    factor = 1.0 + np.asarray(amount, dtype=np.float32)
    if factor.ndim == 2:
        factor = factor[..., None]
    tile[:, :, :3] = np.clip(tile[:, :, :3] * factor, 0, 1)


def _mix(
    a: tuple[float, float, float], b: tuple[float, float, float], t: float
) -> NDArray[np.float32]:
    return np.asarray(a, dtype=np.float32) * (1 - t) + np.asarray(b, dtype=np.float32) * t


def _flat(color: tuple[float, float, float], _: tuple[float, float, float]) -> Tile:
    tile = _canvas(color)
    _shade(tile, _seamless_noise(np.random.default_rng(SEED), 1.2) * 0.012)
    return tile


def _stucco(color: tuple[float, float, float], _: tuple[float, float, float]) -> Tile:
    rng = np.random.default_rng(SEED)
    tile = _canvas(color)
    _shade(tile, _seamless_noise(rng, 1.4) * 0.07 + _seamless_noise(rng, 9.0) * 0.04)
    return tile


def _coursed(
    color: tuple[float, float, float],
    secondary: tuple[float, float, float],
    courses: int,
    min_units: int,
    max_units: int,
    joint_px: int,
    jitter: float,
) -> Tile:
    """Rows of rectangular units with random widths: stone ashlar, ledge stone, brick."""
    rng = np.random.default_rng(SEED)
    tile = _canvas(color)
    course_height = BASE_SIZE // courses
    joint_color = _mix(color, (0.12, 0.12, 0.12), 0.55)
    for course in range(courses):
        top = course * course_height
        cuts = np.sort(
            rng.choice(np.arange(24, BASE_SIZE - 24, 12), rng.integers(min_units, max_units), False)
        )
        edges = [0, *cuts.tolist(), BASE_SIZE]
        for left, right in pairwise(edges):
            unit = _mix(color, secondary, float(rng.random())) * (1 + (rng.random() - 0.5) * jitter)
            tile[top : top + course_height, left:right, :3] = np.clip(unit, 0, 1)
            tile[top : top + course_height, max(right - joint_px, 0) : right, :3] = joint_color
        tile[top : top + joint_px, :, :3] = joint_color
    _shade(tile, _seamless_noise(rng, 1.0) * 0.05)
    return tile


def _ashlar(color: tuple[float, float, float], secondary: tuple[float, float, float]) -> Tile:
    return _coursed(color, secondary, courses=4, min_units=2, max_units=4, joint_px=3, jitter=0.16)


def _ledge(color: tuple[float, float, float], secondary: tuple[float, float, float]) -> Tile:
    return _coursed(color, secondary, courses=12, min_units=2, max_units=5, joint_px=2, jitter=0.3)


def _brick(color: tuple[float, float, float], secondary: tuple[float, float, float]) -> Tile:
    rng = np.random.default_rng(SEED)
    tile = _canvas(color)
    rows, columns, joint_px = 8, 4, 3
    row_height, brick_width = BASE_SIZE // rows, BASE_SIZE // columns
    joint_color = _mix(color, (0.8, 0.8, 0.78), 0.7)
    for row in range(rows):
        shift = (brick_width // 2) if row % 2 else 0
        for column in range(columns + 1):
            left = column * brick_width - shift
            unit = np.clip(
                _mix(color, secondary, float(rng.random())) * (1 + (rng.random() - 0.5) * 0.14),
                0,
                1,
            )
            tile[
                row * row_height : (row + 1) * row_height,
                max(left, 0) : max(left + brick_width, 0),
                :3,
            ] = unit
            if left > 0:
                tile[row * row_height : (row + 1) * row_height, left - joint_px : left, :3] = (
                    joint_color
                )
        tile[row * row_height : row * row_height + joint_px, :, :3] = joint_color
    _shade(tile, _seamless_noise(rng, 1.0) * 0.04)
    return tile


def _grid(
    color: tuple[float, float, float],
    secondary: tuple[float, float, float],
    rows: int,
    columns: int,
) -> Tile:
    rng = np.random.default_rng(SEED)
    tile = _canvas(color)
    cell_height, cell_width, joint_px = BASE_SIZE // rows, BASE_SIZE // columns, 3
    joint_color = _mix(color, (0.15, 0.15, 0.15), 0.5)
    for row in range(rows):
        for column in range(columns):
            unit = np.clip(
                _mix(color, secondary, float(rng.random()) * 0.6)
                * (1 + (rng.random() - 0.5) * 0.06),
                0,
                1,
            )
            tile[
                row * cell_height : (row + 1) * cell_height,
                column * cell_width : (column + 1) * cell_width,
                :3,
            ] = unit
        tile[row * cell_height : row * cell_height + joint_px, :, :3] = joint_color
    for column in range(columns):
        tile[:, column * cell_width : column * cell_width + joint_px, :3] = joint_color
    _shade(tile, _seamless_noise(rng, 6.0) * 0.03)
    return tile


def _tile_grid(color: tuple[float, float, float], secondary: tuple[float, float, float]) -> Tile:
    return _grid(color, secondary, rows=2, columns=2)


def _panel(color: tuple[float, float, float], secondary: tuple[float, float, float]) -> Tile:
    return _grid(color, secondary, rows=2, columns=1)


def _plank(color: tuple[float, float, float], secondary: tuple[float, float, float]) -> Tile:
    """Horizontal planks with stretched grain: wood-look tiles and HPL boards."""
    rng = np.random.default_rng(SEED)
    tile = _canvas(color)
    planks = 6
    plank_height = BASE_SIZE // planks
    grain = _wrap_blur(rng.standard_normal((BASE_SIZE, BASE_SIZE)).astype(np.float32), 28, 0.8)
    grain /= float(np.abs(grain).max()) or 1.0
    for plank in range(planks):
        tile[plank * plank_height : (plank + 1) * plank_height, :, :3] = np.clip(
            _mix(color, secondary, float(rng.random())), 0, 1
        )
        tile[plank * plank_height : plank * plank_height + 2, :, :3] *= 0.6
    _shade(tile, grain * 0.14)
    return tile


def _glass(color: tuple[float, float, float], _: tuple[float, float, float]) -> Tile:
    """Tinted glass panes with a slim steel post at each tile edge."""
    tile = _canvas(color)
    tile[:, :, 3] = 0.38
    highlight = np.linspace(0.12, -0.05, BASE_SIZE, dtype=np.float32)[None, :]
    _shade(tile, np.repeat(highlight, BASE_SIZE, axis=0))
    post = 8
    tile[:, :post, :3] = (0.72, 0.72, 0.72)
    tile[:, :post, 3] = OPAQUE
    return tile


def _bars(color: tuple[float, float, float], _: tuple[float, float, float]) -> Tile:
    """Vertical balusters. Gaps are transparent so the scene shows through."""
    tile = _canvas(color)
    tile[:, :, 3] = 0.0
    bars, bar_px = 4, 14
    spacing = BASE_SIZE // bars
    for bar in range(bars):
        left = bar * spacing + (spacing - bar_px) // 2
        tile[:, left : left + bar_px, 3] = OPAQUE
        tile[:, left : left + 4, :3] = np.clip(np.asarray(color) * 1.35, 0, 1)
    return tile


PATTERNS: dict[str, Callable[[tuple[float, float, float], tuple[float, float, float]], Tile]] = {
    "flat": _flat,
    "stucco": _stucco,
    "ashlar": _ashlar,
    "ledge": _ledge,
    "brick": _brick,
    "tile_grid": _tile_grid,
    "panel": _panel,
    "plank": _plank,
    "glass": _glass,
    "bars": _bars,
}


@lru_cache(maxsize=128)
def _base_tile(pattern: str, color_hex: str, secondary_hex: str) -> Tile:
    builder = PATTERNS.get(pattern, _flat)
    tile = builder(hex_to_bgr(color_hex), hex_to_bgr(secondary_hex))
    tile.setflags(write=False)
    return tile


def material_tile(material: Material, size_px: int | None = None) -> Tile:
    """Texture tile for a material, optionally resized to a pixel size."""
    secondary = material.texture.secondary_color_hex or material.color_hex
    tile = _base_tile(material.texture.pattern, material.color_hex, secondary)
    if size_px is None or size_px == BASE_SIZE:
        return tile
    interpolation = cv2.INTER_AREA if size_px < BASE_SIZE else cv2.INTER_LINEAR
    return cv2.resize(tile, (size_px, size_px), interpolation=interpolation).astype(np.float32)
