"""Region detection with a vision LLM.

A second implementation of ISegmentationService, used when no dedicated
segmentation model is configured. It runs on whichever vision model is configured (Gemini or
Claude). The model is asked to outline each building
component as a polygon in normalised coordinates. It is coarser than a
segmentation model (corners, not pixel-exact edges), which is acceptable here
because every region is reviewed and can be reshaped by the user.
"""

from collections.abc import Iterator
from typing import Any

from pydantic import BaseModel, ValidationError

from domain.entities.region_entity import MIN_POLYGON_POINTS, Point, RegionLabel
from domain.errors.project_errors import AiProviderError
from domain.interfaces.services.image_services import DetectedRegion, ISegmentationService
from infrastructure.services.ai.streaming_json import JsonArrayObjectStream
from infrastructure.services.ai.vision_json_client import (
    LlmBusyError,
    LlmUnreachableError,
    LlmUnreadableError,
    VisionJsonClient,
)

COORDINATE_RANGE = 1000.0
MAX_REGIONS = 60
KNOWN_LABELS = frozenset(label.value for label in RegionLabel)
MIN_AREA_RATIO = 0.0005
DEFAULT_SCORE = 0.5

DETECTION_PROMPT = """You are mapping the exterior of a house for a renovation planning tool.

Outline every visible building component in this photo that a homeowner could refinish. Use
these labels where they fit:
- wall: each main exterior wall surface, as one polygon per wall plane (the whole wall, ignoring
  the windows and doors on it)
- window: each window, including glazed balcony doors
- door: each entrance door
- garage_door: each garage or shutter door
- roof: each visible roof plane (sloped tiles, metal sheet or shingles), one polygon per plane
- roof_edge: a projecting roof slab edge, fascia, eave or cornice band
- parapet: the low wall around a flat roof or terrace
- chimney: each chimney
- balcony: the slab or solid front face of a balcony
- railing: each railing or balustrade
- pillar: each pillar or column
- gate: each entrance gate
- fence: a boundary fence or compound wall
- other: any other distinct exterior part a homeowner might refinish that fits none of the labels
  above (for example solar panels, a water tank, entrance steps, a porch canopy, wall cladding
  panels, shutters). Give it a short plain "name", like "Solar panels" or "Entrance steps".

Rules:
- Coordinates are normalised to the image: x from 0 (left edge) to 1000 (right edge), y from 0
  (top edge) to 1000 (bottom edge).
- Give each polygon as its corner points in clockwise order starting from the top-left corner.
  Most components are four-cornered. Follow the perspective of the photo: corners go on the
  component's real corners, so a polygon is usually a slanted quadrilateral, not an upright box.
- Be precise: place each corner on the actual edge of the component.
- Include only components that belong to the main house and its boundary. Skip sky, ground,
  lawn, trees and plants, vehicles, people and neighbouring buildings.
- Prefer a specific label over "other"; use "other" only when none fits.
- If nothing can be identified, return an empty "regions" list.

Output shape (the key names matter):
{"regions": [{"label": "window", "polygon": [{"x": 120, "y": 340}, {"x": 210, "y": 338},
{"x": 211, "y": 455}, {"x": 121, "y": 458}]}, {"label": "other", "name": "Solar panels",
"polygon": [{"x": 400, "y": 120}, {"x": 520, "y": 118}, {"x": 522, "y": 170},
{"x": 401, "y": 172}]}]}"""

DETECTION_SCHEMA = {
    "type": "object",
    "properties": {
        "regions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "label": {"type": "string", "enum": [label.value for label in RegionLabel]},
                    "name": {"type": "string"},
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
    name: str | None = None
    polygon: list[DetectedPoint]


class DetectionOutput(BaseModel):
    regions: list[DetectedPolygon]


class VisionLlmSegmentationService(ISegmentationService):
    def __init__(self, client: VisionJsonClient) -> None:
        self._client = client

    def is_available(self) -> bool:
        return self._client.is_available()

    def detect(self, image: bytes, width: int, height: int) -> list[DetectedRegion]:
        return list(self.detect_stream(image, width, height))

    def detect_stream(self, image: bytes, width: int, height: int) -> Iterator[DetectedRegion]:
        """Each part as soon as the model has finished writing it, not when the reply ends."""
        if not self._client.is_available():
            raise AiProviderError("Automatic region detection is not configured")
        parser = JsonArrayObjectStream()
        found = 0
        try:
            for piece in self._client.stream_json_text(image, DETECTION_PROMPT, DETECTION_SCHEMA):
                for raw in parser.feed(piece):
                    region = self._to_region(raw, width, height)
                    if region is not None and found < MAX_REGIONS:
                        found += 1
                        yield region
        except LlmBusyError as error:
            raise AiProviderError("Region detection is busy. Try again in a minute.") from error
        except LlmUnreachableError as error:
            raise AiProviderError("Region detection could not be reached. Try again.") from error
        except LlmUnreadableError as error:
            raise AiProviderError("Region detection returned an unreadable answer.") from error
        except AiProviderError as error:
            raise AiProviderError("Region detection failed. Try again.") from error
        if found == 0:
            raise AiProviderError(
                "No building parts were found in this photo. You can draw the regions by hand."
            )

    def _to_region(self, raw: dict[str, Any], width: int, height: int) -> DetectedRegion | None:
        """One part of the answer as a region, or None if it is unusable."""
        try:
            parsed = DetectionOutput.model_validate(self._normalise({"regions": [raw]}))
        except ValidationError:
            return None
        if not parsed.regions:
            return None
        item = parsed.regions[0]
        polygon = self._to_pixels(item.polygon, width, height)
        if polygon is None:
            return None
        return DetectedRegion(
            label=item.label, polygon=polygon, score=DEFAULT_SCORE, name=item.name
        )

    @staticmethod
    def _normalise(raw: dict[str, Any]) -> dict[str, Any]:
        """Accept the common shape variations of an endpoint that does not enforce the schema.

        Polygons may arrive under "points" or "corners", and a point as [x, y]. A label outside
        the list is not an error: the part is kept as `other`, named after what the model called
        it, so a new kind of part is never thrown away.
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
            label, name = _resolve_label(item.get("label"), item.get("name"))
            regions.append({"label": label, "name": name, "polygon": polygon})
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


def _resolve_label(raw_label: object, raw_name: object) -> tuple[str, str | None]:
    """Map the model's label onto ours; anything unknown becomes a named `other` part."""
    name = raw_name.strip() if isinstance(raw_name, str) and raw_name.strip() else None
    text = raw_label.strip().lower() if isinstance(raw_label, str) else ""
    key = text.replace(" ", "_").replace("-", "_")
    if key in KNOWN_LABELS:
        return key, name
    if not text:
        return RegionLabel.OTHER.value, name
    return RegionLabel.OTHER.value, name or text.replace("_", " ").capitalize()
