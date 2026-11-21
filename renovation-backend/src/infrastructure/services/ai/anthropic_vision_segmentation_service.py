"""Region detection with a vision LLM.

A second implementation of ISegmentationService, used when no dedicated
segmentation model is configured. The model is asked to outline each building
component as a polygon in normalised coordinates. It is coarser than a
segmentation model (corners, not pixel-exact edges), which is acceptable here
because every region is reviewed and can be reshaped by the user.
"""

from typing import Any

import anthropic
from pydantic import BaseModel, ValidationError

from domain.entities.region_entity import MIN_POLYGON_POINTS, Point, RegionLabel
from domain.errors.project_errors import AiProviderError
from domain.interfaces.services.image_services import DetectedRegion, ISegmentationService
from infrastructure.services.ai.anthropic_json import request_json
from infrastructure.utils.logger import logger

COORDINATE_RANGE = 1000.0
MAX_REGIONS = 60
MIN_AREA_RATIO = 0.0005
DEFAULT_SCORE = 0.5

DETECTION_PROMPT = """You are mapping the exterior of a house for a renovation planning tool.

Outline every visible building component in this photo. Use exactly these labels:
- wall: each main exterior wall surface, as one polygon per wall plane (the whole wall, ignoring
  the windows and doors on it)
- window: each window, including glazed balcony doors
- door: each entrance door
- balcony: the slab or solid front face of a balcony
- railing: each railing or balustrade
- pillar: each pillar or column
- parapet: the low wall around the roof or terrace
- roof_edge: a projecting roof slab edge, fascia or cornice band
- gate: each entrance gate

Rules:
- Coordinates are normalised to the image: x from 0 (left edge) to 1000 (right edge), y from 0
  (top edge) to 1000 (bottom edge).
- Give each polygon as its corner points in clockwise order starting from the top-left corner.
  Most components are four-cornered. Follow the perspective of the photo: corners go on the
  component's real corners, so a polygon is usually a slanted quadrilateral, not an upright box.
- Be precise: place each corner on the actual edge of the component.
- Include only components that belong to the main house and its boundary. Skip sky, ground,
  vegetation, vehicles and neighbouring buildings.
- If nothing can be identified, return an empty "regions" list.

Output shape (the key names matter):
{"regions": [{"label": "window", "polygon": [{"x": 120, "y": 340}, {"x": 210, "y": 338},
{"x": 211, "y": 455}, {"x": 121, "y": 458}]}]}"""

DETECTION_SCHEMA = {
    "type": "object",
    "properties": {
        "regions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "label": {"type": "string", "enum": [label.value for label in RegionLabel]},
                    "polygon": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {"x": {"type": "number"}, "y": {"type": "number"}},
                            "required": ["x", "y"],
                            "additionalProperties": False,
                        },
                    },
                },
                "required": ["label", "polygon"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["regions"],
    "additionalProperties": False,
}


class DetectedPoint(BaseModel):
    x: float
    y: float


class DetectedPolygon(BaseModel):
    label: RegionLabel
    polygon: list[DetectedPoint]


class DetectionOutput(BaseModel):
    regions: list[DetectedPolygon]


class AnthropicVisionSegmentationService(ISegmentationService):
    def __init__(self, client: anthropic.Anthropic | None, model: str) -> None:
        self._client = client
        self._model = model

    def is_available(self) -> bool:
        return self._client is not None

    def detect(self, image: bytes, width: int, height: int) -> list[DetectedRegion]:
        if self._client is None:
            raise AiProviderError("Automatic region detection is not configured")
        try:
            raw = request_json(self._client, self._model, image, DETECTION_PROMPT, DETECTION_SCHEMA)
            parsed = DetectionOutput.model_validate(self._normalise(raw))
        except anthropic.RateLimitError as error:
            raise AiProviderError("Region detection is busy. Try again in a minute.") from error
        except anthropic.APIStatusError as error:
            logger.warning("Vision detection failed: API status %s", error.status_code)
            raise AiProviderError("Region detection failed. Try again.") from error
        except anthropic.APIConnectionError as error:
            raise AiProviderError("Region detection could not be reached. Try again.") from error
        except ValidationError as error:
            raise AiProviderError("Region detection returned an unreadable answer.") from error

        regions = [
            DetectedRegion(label=item.label, polygon=polygon, score=DEFAULT_SCORE)
            for item in parsed.regions[:MAX_REGIONS]
            if (polygon := self._to_pixels(item.polygon, width, height)) is not None
        ]
        if not regions:
            raise AiProviderError(
                "No building parts were found in this photo. You can draw the regions by hand."
            )
        return regions

    @staticmethod
    def _normalise(raw: dict[str, Any]) -> dict[str, Any]:
        """Accept the common shape variations of an endpoint that does not enforce the schema.

        Polygons may arrive under "points" or "corners", and a point as [x, y].
        """
        regions = []
        for item in raw.get("regions") or []:
            if not isinstance(item, dict):
                continue
            corners = item.get("polygon") or item.get("points") or item.get("corners") or []
            polygon = [
                {"x": point[0], "y": point[1]} if isinstance(point, (list, tuple)) else point
                for point in corners
                if isinstance(point, dict) or (isinstance(point, (list, tuple)) and len(point) == 2)
            ]
            regions.append({"label": item.get("label"), "polygon": polygon})
        return {"regions": regions}

    @staticmethod
    def _to_pixels(
        points: list[DetectedPoint], width: int, height: int
    ) -> tuple[Point, ...] | None:
        """Scale normalised corners to image pixels; drop degenerate shapes."""
        if len(points) < MIN_POLYGON_POINTS:
            return None
        polygon = tuple(
            (
                round(min(max(point.x, 0.0), COORDINATE_RANGE) / COORDINATE_RANGE * width, 1),
                round(min(max(point.y, 0.0), COORDINATE_RANGE) / COORDINATE_RANGE * height, 1),
            )
            for point in points
        )
        area = 0.0
        for index, (x1, y1) in enumerate(polygon):
            x2, y2 = polygon[(index + 1) % len(polygon)]
            area += x1 * y2 - x2 * y1
        if abs(area) / 2 < MIN_AREA_RATIO * width * height:
            return None
        return polygon
