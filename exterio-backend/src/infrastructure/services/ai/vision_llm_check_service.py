"""Vision-LLM photo check, on whichever vision model is configured (Gemini or Claude).

Pixel heuristics can tell that a photo is sharp and bright, but not that it
shows a house. This asks a vision model the questions a person would ask and
reads the answer as schema-validated JSON.
"""

from typing import Literal

from pydantic import BaseModel, ValidationError

from domain.entities.project_entity import IssueSeverity, QualityIssue
from domain.errors.project_errors import AiProviderError
from domain.interfaces.services.image_services import IVisionCheckService, VisionVerdict
from infrastructure.services.ai.vision_json_client import VisionJsonClient
from infrastructure.utils.logger import logger

VISION_PROMPT = """You are checking a photo a homeowner uploaded to plan an exterior renovation.
The system will detect walls, windows, pillars and railings in it and estimate their area.

Decide whether the photo is usable for that, and report only real problems:
- NOT_EXTERIOR (error): it is not the outside of a building (interior, document, person, etc).
- NOT_RESIDENTIAL (warning): it is a high-rise, factory or other non-residential building.
- FACADE_CUT_OFF (warning): a large part of the front of the house is outside the frame.
- HEAVY_OCCLUSION (warning, or error if under half the facade is visible): trees, vehicles or
  people hide much of the facade.
- STEEP_ANGLE (warning): taken from a very oblique angle, so one side is strongly foreshortened.
- NIGHT (warning): taken at night or in very low light.

For each issue write one short sentence the homeowner will read ("message"), and one practical
tip for retaking the photo ("tip"). If the photo is fine, return an empty "issues" list.
A drawing or illustration of a house exterior is acceptable.

Output shape (the key names matter):
{"issues": [{"code": "STEEP_ANGLE", "severity": "warning", "message": "...", "tip": "..."}]}"""

ISSUE_CODES = [
    "NOT_EXTERIOR",
    "NOT_RESIDENTIAL",
    "FACADE_CUT_OFF",
    "HEAVY_OCCLUSION",
    "STEEP_ANGLE",
    "NIGHT",
]

VISION_SCHEMA = {
    "type": "object",
    "properties": {
        "issues": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "code": {"type": "string", "enum": ISSUE_CODES},
                    "severity": {"type": "string", "enum": ["error", "warning"]},
                    "message": {"type": "string"},
                    "tip": {"type": "string"},
                },
                "required": ["code", "severity", "message", "tip"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["issues"],
    "additionalProperties": False,
}


class VisionIssue(BaseModel):
    code: Literal[
        "NOT_EXTERIOR",
        "NOT_RESIDENTIAL",
        "FACADE_CUT_OFF",
        "HEAVY_OCCLUSION",
        "STEEP_ANGLE",
        "NIGHT",
    ]
    severity: Literal["error", "warning"]
    message: str
    tip: str


class VisionCheckOutput(BaseModel):
    issues: list[VisionIssue]


class VisionLlmCheckService(IVisionCheckService):
    def __init__(self, client: VisionJsonClient) -> None:
        self._client = client

    def is_available(self) -> bool:
        return self._client.is_available()

    def check(self, image: bytes) -> VisionVerdict:
        """Never blocks an upload on a provider failure: the pixel checks already passed."""
        empty = VisionVerdict(issues=(), guidance=())
        if not self._client.is_available():
            return empty
        try:
            raw = self._client.request_json(image, VISION_PROMPT, VISION_SCHEMA)
            parsed = VisionCheckOutput.model_validate(raw)
        except (AiProviderError, ValidationError) as error:
            logger.warning("Vision check skipped: %s", type(error).__name__)
            return empty

        return VisionVerdict(
            issues=tuple(
                QualityIssue(issue.code, IssueSeverity(issue.severity), issue.message)
                for issue in parsed.issues
            ),
            guidance=tuple(issue.tip for issue in parsed.issues),
        )
