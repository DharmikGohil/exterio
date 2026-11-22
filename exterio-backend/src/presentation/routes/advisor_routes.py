from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from domain.use_cases.advisor.ask_advisor_usecase import AskAdvisorUseCase
from infrastructure.registry import InfrastructureRegistry
from presentation.controllers.advisor.ask_advisor_controller import AskAdvisorController
from presentation.controllers.advisor.stream_advisor_controller import StreamAdvisorController
from presentation.routes.shared_wiring import SharedWiring
from presentation.schemas.advisor_schema import AdvisorChatResponse


def build_advisor_router(registry: InfrastructureRegistry, shared: SharedWiring) -> APIRouter:
    ask_advisor_use_case = AskAdvisorUseCase(
        registry.project_repo, registry.knowledge_repo, registry.advisor_model, shared.get_estimate
    )
    ask_advisor = AskAdvisorController(ask_advisor_use_case)
    stream_advisor = StreamAdvisorController(ask_advisor_use_case)

    router = APIRouter(
        prefix="/advisor", tags=["Advisor"], dependencies=[Depends(shared.auth.authenticate)]
    )
    router.add_api_route(
        "/chat", ask_advisor.handle, methods=["POST"], response_model=AdvisorChatResponse
    )
    router.add_api_route(
        "/chat/stream",
        stream_advisor.handle,
        methods=["POST"],
        response_class=StreamingResponse,
        summary="Ask the advisor, streamed as server-sent events",
    )
    return router
