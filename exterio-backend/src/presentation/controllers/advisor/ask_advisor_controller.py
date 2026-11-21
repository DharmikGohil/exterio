from fastapi import Depends

from domain.interfaces.dtos.advisor_dto import ChatMessageDTO
from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.advisor.ask_advisor_usecase import AskAdvisorUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.advisor_schema import AdvisorChatRequest, AdvisorChatResponse


class AskAdvisorController:
    def __init__(self, ask_advisor: AskAdvisorUseCase) -> None:
        self._ask_advisor = ask_advisor

    def handle(
        self, body: AdvisorChatRequest, user: UserDTO = Depends(get_authenticated_user)
    ) -> AdvisorChatResponse:
        messages = [ChatMessageDTO(item.role, item.content) for item in body.messages]
        reply = self._ask_advisor.execute(body.project_id, body.design_id, user.id, messages)
        return AdvisorChatResponse.model_validate(reply)
