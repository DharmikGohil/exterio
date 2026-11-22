"""Draws the demo house used by "Try with a sample".

The house is drawn flat at a known scale and then photographed by a simulated
pinhole camera standing slightly to one side. Because every dimension is known
exactly, the same scene doubles as ground truth for the measurement tests.
"""

from dataclasses import dataclass

import cv2
import numpy as np
from numpy.typing import NDArray

from domain.entities.region_entity import Point, Region, RegionLabel, RegionSource
from domain.entities.scale_reference_entity import ScaleMethod, ScaleReference
from domain.interfaces.services.image_services import (
    ISampleHouseProvider,
    SampleHouse,
    SampleHouseSummary,
)
from infrastructure.services.imaging.image_codec import encode_jpeg

CANVAS_WIDTH = 1500
CANVAS_HEIGHT = 1000
PIXELS_PER_FOOT = 30.0
FACADE_WIDTH_FT = 30.0
FACADE_HEIGHT_FT = 20.0
FACADE_LEFT_PX = 300.0
GROUND_PX = 850.0
CAMERA_YAW_DEGREES = 13.0
CAMERA_FOCAL_PX = 1125.0  # 0.75 x the long side, a typical phone camera
SEED = 11
SCENE_MARGIN_PX = 500


@dataclass(frozen=True)
class Part:
    """A rectangle on the facade, in feet from its bottom-left corner."""

    name: str
    label: RegionLabel
    left: float
    bottom: float
    right: float
    top: float
    color: tuple[int, int, int]  # BGR
    multiplier: float = 1.0

    @property
    def area_sqft(self) -> float:
        return (self.right - self.left) * (self.top - self.bottom)


PARTS: tuple[Part, ...] = (
    Part("Parapet", RegionLabel.PARAPET, 0, 20, 30, 23, (176, 196, 208)),
    Part("Front wall", RegionLabel.WALL, 0, 0, 30, 20, (190, 211, 224)),
    Part("Roof edge", RegionLabel.ROOF_EDGE, 0, 19, 30, 20, (150, 160, 168)),
    Part("Gate", RegionLabel.GATE, -8.5, 0, -1.5, 5, (60, 62, 66)),
    Part("Left pillar", RegionLabel.PILLAR, 10, 0, 11.2, 9.5, (205, 214, 220), 3.0),
    Part("Right pillar", RegionLabel.PILLAR, 18.8, 0, 20, 9.5, (205, 214, 220), 3.0),
    Part("Balcony slab", RegionLabel.BALCONY, 10, 9.5, 20, 10.5, (165, 172, 178)),
    Part("Balcony railing", RegionLabel.RAILING, 10, 10.5, 20, 13.5, (70, 70, 74)),
    Part("Main door", RegionLabel.DOOR, 13.25, 0, 16.75, 7, (52, 78, 112)),
    Part("Ground window left", RegionLabel.WINDOW, 3, 3, 8, 7, (92, 74, 58)),
    Part("Ground window right", RegionLabel.WINDOW, 22, 3, 27, 7, (92, 74, 58)),
    Part("Upper window left", RegionLabel.WINDOW, 3, 13, 8, 17, (92, 74, 58)),
    Part("Upper window right", RegionLabel.WINDOW, 22, 13, 27, 17, (92, 74, 58)),
    Part("Balcony door", RegionLabel.WINDOW, 12, 10.5, 18, 17.5, (98, 80, 62)),
)

SAMPLE_MATERIALS: dict[RegionLabel, str] = {
    RegionLabel.WALL: "paint-warm-cream",
    RegionLabel.PARAPET: "texture-sand-finish",
    RegionLabel.ROOF_EDGE: "paint-charcoal",
    RegionLabel.PILLAR: "stone-sandstone-ashlar",
    RegionLabel.BALCONY: "paint-charcoal",
    RegionLabel.RAILING: "railing-glass-12mm",
    RegionLabel.GATE: "paint-charcoal",
}


DRAWN_SAMPLE = SampleHouseSummary(key="drawn", name="Drawn test house")


class SampleHouseProvider(ISampleHouseProvider):
    """The drawn house: ground truth for the measurement tests, not offered to people."""

    def samples(self) -> tuple[SampleHouseSummary, ...]:
        return (DRAWN_SAMPLE,)

    def build(self, key: str | None = None) -> SampleHouse:
        camera = self.camera_homography()
        # The flat scene is drawn with a margin so the camera view never runs off its edge.
        unpad = np.array([[1, 0, -SCENE_MARGIN_PX], [0, 1, -SCENE_MARGIN_PX], [0, 0, 1]])
        photo = cv2.warpPerspective(
            self._draw_flat_scene(),
            camera @ unpad,
            (CANVAS_WIDTH, CANVAS_HEIGHT),
            borderMode=cv2.BORDER_REPLICATE,
        )
        regions = tuple(
            Region(
                id=f"sample-{index}",
                label=part.label,
                name=part.name,
                polygon=self._project(self._part_corners(part), camera),
                source=RegionSource.AUTO,
                surface_multiplier=part.multiplier,
            )
            for index, part in enumerate(PARTS, start=1)
        )
        facade = Part("", RegionLabel.WALL, 0, 0, FACADE_WIDTH_FT, FACADE_HEIGHT_FT, (0, 0, 0))
        tl, tr, br, bl = self._project(self._part_corners(facade), camera)
        scale = ScaleReference(
            method=ScaleMethod.FACADE_DIMENSIONS,
            facade_corners=(tl, tr, br, bl),
            facade_width_ft=FACADE_WIDTH_FT,
            facade_height_ft=FACADE_HEIGHT_FT,
            storeys=2,
        )
        return SampleHouse(
            name=DRAWN_SAMPLE.name,
            design_name="Warm stone and cream",
            image=encode_jpeg(photo.astype(np.uint8), quality=92),
            regions=regions,
            scale=scale,
            assignments={
                region.id: SAMPLE_MATERIALS[region.label]
                for region in regions
                if region.label in SAMPLE_MATERIALS
            },
        )

    @staticmethod
    def camera_homography() -> NDArray[np.float64]:
        """Pinhole camera rotated about the vertical axis, looking at the flat drawing."""
        yaw = np.radians(CAMERA_YAW_DEGREES)
        centre_x, centre_y = CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2
        intrinsics = np.array(
            [[CAMERA_FOCAL_PX, 0, centre_x], [0, CAMERA_FOCAL_PX, centre_y], [0, 0, 1]]
        )
        pose = np.array([[np.cos(yaw), 0, 0], [0, 1, 0], [-np.sin(yaw), 0, CAMERA_FOCAL_PX]])
        centring = np.array([[1, 0, -centre_x], [0, 1, -centre_y], [0, 0, 1]])
        return np.asarray(intrinsics @ pose @ centring, dtype=np.float64)

    @staticmethod
    def _part_corners(part: Part) -> list[Point]:
        """Top-left, top-right, bottom-right, bottom-left in flat-canvas pixels."""
        left = FACADE_LEFT_PX + part.left * PIXELS_PER_FOOT
        right = FACADE_LEFT_PX + part.right * PIXELS_PER_FOOT
        top = GROUND_PX - part.top * PIXELS_PER_FOOT
        bottom = GROUND_PX - part.bottom * PIXELS_PER_FOOT
        return [(left, top), (right, top), (right, bottom), (left, bottom)]

    @staticmethod
    def _project(points: list[Point], camera: NDArray[np.float64]) -> tuple[Point, ...]:
        source = np.asarray(points, dtype=np.float64).reshape(-1, 1, 2)
        projected = cv2.perspectiveTransform(source, camera).reshape(-1, 2)
        return tuple((round(float(x), 2), round(float(y), 2)) for x, y in projected)

    def _draw_flat_scene(self) -> NDArray[np.uint8]:
        """Front-on drawing of the house on a canvas padded by SCENE_MARGIN_PX on every side."""
        rng = np.random.default_rng(SEED)
        margin = SCENE_MARGIN_PX
        height, width = CANVAS_HEIGHT + 2 * margin, CANVAS_WIDTH + 2 * margin
        scene = np.zeros((height, width, 3), dtype=np.float32)

        sky = np.linspace(0, 1, height, dtype=np.float32)[:, None, None]
        scene[:] = (
            np.array([235, 190, 130], np.float32) * (1 - sky) + np.array([250, 235, 215]) * sky
        )
        ground = int(GROUND_PX) + margin
        scene[ground:] = (118, 124, 128)
        scene[ground - 6 : ground + 4] = (96, 132, 98)

        # Compound wall on both sides of the house, behind the gate.
        wall_top = ground - int(5 * PIXELS_PER_FOOT)
        facade_left = int(FACADE_LEFT_PX) + margin
        facade_right = facade_left + int(FACADE_WIDTH_FT * PIXELS_PER_FOOT)
        scene[wall_top:ground, :facade_left] = (170, 182, 190)
        scene[wall_top:ground, facade_right:] = (170, 182, 190)

        house = scene[margin : margin + CANVAS_HEIGHT, margin : margin + CANVAS_WIDTH]
        for part in PARTS:
            (left, top), _, (right, bottom), _ = self._part_corners(part)
            house[int(top) : int(bottom), int(left) : int(right)] = part.color
            if part.label in (RegionLabel.WINDOW, RegionLabel.DOOR):
                self._draw_opening(house, int(left), int(top), int(right), int(bottom), part)
            if part.label == RegionLabel.RAILING:
                self._draw_railing(house, int(left), int(top), int(right), int(bottom))
            if part.label == RegionLabel.GATE:
                house[int(top) : int(bottom), int(left) : int(right) : 14] = (30, 30, 32)

        self._add_shadows(house)
        scene += rng.normal(0, 3.0, scene.shape).astype(np.float32)
        return np.clip(scene, 0, 255).astype(np.uint8)

    @staticmethod
    def _draw_opening(
        scene: NDArray[np.float32], left: int, top: int, right: int, bottom: int, part: Part
    ) -> None:
        frame = 6
        if part.label == RegionLabel.DOOR:
            scene[top + frame : bottom, left + frame : right - frame] = (46, 70, 104)
            middle = (left + right) // 2
            scene[top + frame : bottom, middle - 1 : middle + 1] = (30, 46, 70)
            return
        glass = scene[top + frame : bottom - frame, left + frame : right - frame]
        gradient = np.linspace(0.75, 1.15, glass.shape[0], dtype=np.float32)[:, None, None]
        glass[:] = np.array([150, 120, 86], np.float32) * gradient
        middle = (left + right) // 2
        scene[top:bottom, middle - 2 : middle + 2] = part.color

    @staticmethod
    def _draw_railing(
        scene: NDArray[np.float32], left: int, top: int, right: int, bottom: int
    ) -> None:
        scene[top:bottom, left:right] = (190, 211, 224)
        scene[top : top + 5, left:right] = (58, 58, 62)
        scene[top:bottom, left:right:12] = (58, 58, 62)

    @staticmethod
    def _add_shadows(scene: NDArray[np.float32]) -> None:
        """Soft shadow under the balcony slab and a light gradient across the wall."""
        slab_bottom = int(GROUND_PX - 9.5 * PIXELS_PER_FOOT)
        left = int(FACADE_LEFT_PX + 10 * PIXELS_PER_FOOT)
        right = int(FACADE_LEFT_PX + 20 * PIXELS_PER_FOOT)
        depth = int(4 * PIXELS_PER_FOOT)
        fade = np.linspace(0.62, 1.0, depth, dtype=np.float32)[:, None, None]
        scene[slab_bottom : slab_bottom + depth, left:right] *= fade

        facade_left = int(FACADE_LEFT_PX)
        facade_right = int(FACADE_LEFT_PX + FACADE_WIDTH_FT * PIXELS_PER_FOOT)
        facade_top = int(GROUND_PX - 23 * PIXELS_PER_FOOT)
        sweep = np.linspace(1.05, 0.9, facade_right - facade_left, dtype=np.float32)[None, :, None]
        scene[facade_top : int(GROUND_PX), facade_left:facade_right] *= sweep
