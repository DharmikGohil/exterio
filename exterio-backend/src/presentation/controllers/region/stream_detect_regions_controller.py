import json
from collections.abc import Iterator

from fastapi import Depends
from fastapi.responses import StreamingResponse

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.region.detect_regions_usecase import (
    DetectionDoneEvent,
    DetectionEvent,
    DetectionFailedEvent,
    DetectRegionsUseCase,
    RegionFoundEvent,
)
from infrastructure.utils.logger import logger
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.project_schema import ProjectResponse, RegionResponse


class StreamDetectRegionsController:
    """Auto-detect as server-sent events: `region` for each part as the AI writes it, then
    `done` with the saved project, or `error`."""

    def __init__(self, detect_regions: DetectRegionsUseCase) -> None:
        self._detect_regions = detect_regions

    def handle(
        self, project_id: str, user: UserDTO = Depends(get_authenticated_user)
    ) -> StreamingResponse:
        # Access and configuration are checked here, before the response starts.
        events = self._detect_regions.stream(project_id, user.id)
        return StreamingResponse(
            self._encode(events),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    @classmethod
    def _encode(cls, events: Iterator[DetectionEvent]) -> Iterator[str]:
        try:
            for event in events:
                name, data = cls._to_wire(event)
                yield f"event: {name}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
        except Exception:
            # The status line has already gone out, so the failure has to travel as an event.
            logger.exception("Region detection stream failed")
            message = {"message": "Region detection failed. Try again."}
            yield f"event: error\ndata: {json.dumps(message)}\n\n"

    @staticmethod
    def _to_wire(event: DetectionEvent) -> tuple[str, dict[str, object]]:
        if isinstance(event, RegionFoundEvent):
            region = RegionResponse.model_validate(event.region, from_attributes=True)
            return "region", region.model_dump(mode="json", by_alias=True)
        if isinstance(event, DetectionDoneEvent):
            project = ProjectResponse.model_validate(event.project)
            return "done", project.model_dump(mode="json", by_alias=True)
        if isinstance(event, DetectionFailedEvent):
            return "error", {"message": event.message}
        raise TypeError(f"Unknown detection event {type(event).__name__}")
