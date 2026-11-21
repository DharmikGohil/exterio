"""Facade segmentation with SAM 3 (text-prompted) hosted on fal.ai.

One request per building component. Each returned mask is cleaned up and
converted to a simplified polygon, which is what the rest of the system stores,
edits and measures.
"""

from concurrent.futures import ThreadPoolExecutor
from typing import Any

import cv2
import numpy as np
from numpy.typing import NDArray

from domain.entities.region_entity import Point, RegionLabel
from domain.errors.project_errors import AiProviderError
from domain.interfaces.services.image_services import DetectedRegion, ISegmentationService
from infrastructure.services.ai.fal_client import FalClient, to_data_uri
from infrastructure.utils.logger import logger

LABEL_PROMPTS: dict[RegionLabel, str] = {
    RegionLabel.WALL: "exterior wall of the house",
    RegionLabel.WINDOW: "window",
    RegionLabel.DOOR: "door",
    RegionLabel.BALCONY: "balcony",
    RegionLabel.PILLAR: "pillar",
    RegionLabel.PARAPET: "parapet wall on the roof",
    RegionLabel.GATE: "gate",
    RegionLabel.ROOF_EDGE: "roof edge",
    RegionLabel.RAILING: "railing",
}

MAX_MASKS_PER_LABEL = 16
MAX_PARALLEL_REQUESTS = 4
MIN_AREA_RATIO = 0.0008
POLYGON_EPSILON_RATIO = 0.004
MASK_THRESHOLD = 127
CLEANUP_KERNEL_PX = 5
DUPLICATE_IOU = 0.7
MAX_REGIONS_PER_LABEL = 24


class FalSam3SegmentationService(ISegmentationService):
    def __init__(self, client: FalClient, model: str) -> None:
        self._client = client
        self._model = model

    def is_available(self) -> bool:
        return self._client.is_configured

    def detect(self, image: bytes, width: int, height: int) -> list[DetectedRegion]:
        image_uri = to_data_uri(image)
        with ThreadPoolExecutor(max_workers=MAX_PARALLEL_REQUESTS) as pool:
            results = list(
                pool.map(
                    lambda label: self._detect_label(image_uri, label, width, height), LABEL_PROMPTS
                )
            )
        regions = [region for label_regions in results for region in label_regions]
        if not regions:
            raise AiProviderError(
                "No building parts were found in this photo. You can draw the regions by hand."
            )
        return regions

    def _detect_label(
        self, image_uri: str, label: RegionLabel, width: int, height: int
    ) -> list[DetectedRegion]:
        try:
            result = self._client.run(
                self._model,
                {
                    "image_url": image_uri,
                    "prompt": LABEL_PROMPTS[label],
                    "apply_mask": False,
                    "return_multiple_masks": True,
                    "max_masks": MAX_MASKS_PER_LABEL,
                    "include_scores": True,
                    "sync_mode": True,
                    "output_format": "png",
                },
            )
        except AiProviderError:
            # One component failing should not lose the others.
            logger.warning("Segmentation skipped for label %s", label)
            return []

        scores = result.get("scores") or []
        kept: list[tuple[NDArray[np.uint8], float]] = []
        for index, mask_file in enumerate(result.get("masks") or []):
            mask = self._decode_mask(self._client.fetch(mask_file["url"]), width, height)
            if mask is None or self._is_duplicate(mask, [item[0] for item in kept]):
                continue
            kept.append((mask, float(scores[index]) if index < len(scores) else 1.0))

        regions: list[DetectedRegion] = []
        for mask, score in kept:
            for polygon in self._to_polygons(mask):
                regions.append(DetectedRegion(label=label, polygon=polygon, score=score))
        return regions[:MAX_REGIONS_PER_LABEL]

    @staticmethod
    def _decode_mask(data: bytes, width: int, height: int) -> NDArray[np.uint8] | None:
        decoded = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_UNCHANGED)
        if decoded is None:
            return None
        values: NDArray[Any] = np.asarray(decoded)
        if values.ndim == 3:
            # A mask may arrive as an alpha channel or as a white-on-black picture.
            has_alpha = values.shape[2] == 4 and values[:, :, 3].min() < 255
            values = values[:, :, 3] if has_alpha else values[:, :, :3].max(axis=2)
        if values.shape[:2] != (height, width):
            values = np.asarray(
                cv2.resize(values, (width, height), interpolation=cv2.INTER_NEAREST)
            )
        binary = (values > MASK_THRESHOLD).astype(np.uint8)
        kernel = np.ones((CLEANUP_KERNEL_PX, CLEANUP_KERNEL_PX), np.uint8)
        opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        return cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel).astype(np.uint8)

    @staticmethod
    def _is_duplicate(mask: NDArray[np.uint8], others: list[NDArray[np.uint8]]) -> bool:
        for other in others:
            union = int(np.logical_or(mask, other).sum())
            if union and int(np.logical_and(mask, other).sum()) / union > DUPLICATE_IOU:
                return True
        return False

    @staticmethod
    def _to_polygons(mask: NDArray[np.uint8]) -> list[tuple[Point, ...]]:
        min_area = MIN_AREA_RATIO * mask.shape[0] * mask.shape[1]
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        polygons: list[tuple[Point, ...]] = []
        for contour in contours:
            if cv2.contourArea(contour) < min_area:
                continue
            epsilon = POLYGON_EPSILON_RATIO * cv2.arcLength(contour, True)
            simplified = cv2.approxPolyDP(contour, epsilon, True).reshape(-1, 2)
            if len(simplified) >= 3:
                polygons.append(tuple((float(x), float(y)) for x, y in simplified))
        return polygons
