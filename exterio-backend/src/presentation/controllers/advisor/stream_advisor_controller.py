import json
from collections.abc import Iterator
from dataclasses import asdict

from fastapi import Depends
from fastapi.responses import StreamingResponse

from domain.interfaces.dtos.advisor_dto import (
    AdvisorDoneEventDTO,
    AdvisorErrorEventDTO,
    AdvisorEventDTO,
    AdvisorStepEventDTO,
    AdvisorTextEventDTO,
    ChatMessageDTO,
)
from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.advisor.ask_advisor_usecase import AskAdvisorUseCase
from infrastructure.utils.logger import logger
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.advisor_schema import AdvisorChatRequest, AdvisorChatResponse


class StreamAdvisorController:
    """The advisor's answer as server-sent events: `step`, `text`, then `done` or `error`."""

    def __init__(self, ask_advisor: AskAdvisorUseCase) -> None:
        self._ask_advisor = ask_advisor

    def handle(
        self, body: AdvisorChatRequest, user: UserDTO = Depends(get_authenticated_user)
    ) -> StreamingResponse:
        messages = [ChatMessageDTO(item.role, item.content) for item in body.messages]
        # Access is checked here, before the response starts, so failures keep their status.
        events = self._ask_advisor.stream(body.project_id, body.design_id, user.id, messages)
        return StreamingResponse(
            self._encode(events),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    @classmethod
    def _encode(cls, events: Iterator[AdvisorEventDTO]) -> Iterator[str]:
        try:
            for event in events:
                name, data = cls._to_wire(event)
                yield f"event: {name}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
        except Exception:
            # The status line has already gone out, so the failure has to travel as an event.
            logger.exception("Advisor stream failed")
            message = {"message": "The advisor could not answer right now."}
            yield f"event: error\ndata: {json.dumps(message)}\n\n"

    @staticmethod
    def _to_wire(event: AdvisorEventDTO) -> tuple[str, dict[str, object]]:
        if isinstance(event, AdvisorStepEventDTO):
            return "step", asdict(event)
        if isinstance(event, AdvisorTextEventDTO):
            return "text", {"text": event.text}
        if isinstance(event, AdvisorDoneEventDTO):
            reply = AdvisorChatResponse.model_validate(event.reply)
            return "done", reply.model_dump(by_alias=True)
        if isinstance(event, AdvisorErrorEventDTO):
            return "error", {"message": event.message}
        raise TypeError(f"Unknown advisor event {type(event).__name__}")
