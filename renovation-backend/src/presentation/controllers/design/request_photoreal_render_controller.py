from fastapi import BackgroundTasks, Depends

from domain.interfaces.dtos.auth_dto import UserDTO
from domain.use_cases.design.request_photoreal_render_usecase import RequestPhotorealRenderUseCase
from domain.use_cases.design.run_photoreal_render_usecase import RunPhotorealRenderUseCase
from presentation.middleware.auth_middleware import get_authenticated_user
from presentation.schemas.project_schema import DesignResponse


class RequestPhotorealRenderController:
    """Answers immediately with a pending design; the AI call runs after the response."""

    def __init__(
        self, request_render: RequestPhotorealRenderUseCase, run_render: RunPhotorealRenderUseCase
    ) -> None:
        self._request_render = request_render
        self._run_render = run_render

    def handle(
        self,
        design_id: str,
        background_tasks: BackgroundTasks,
        user: UserDTO = Depends(get_authenticated_user),
    ) -> DesignResponse:
        design = self._request_render.execute(design_id, user.id)
        background_tasks.add_task(self._run_render.execute, design_id)
        return DesignResponse.model_validate(design)
