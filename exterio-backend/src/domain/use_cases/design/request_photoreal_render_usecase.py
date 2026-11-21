from dataclasses import replace
from datetime import UTC, datetime, timedelta

from domain.entities.design_entity import RenderStatus
from domain.errors.project_errors import (
    AiNotConfiguredError,
    InvalidAssignmentError,
    RenderInProgressError,
    RenderLimitReachedError,
)
from domain.interfaces.dtos.project_dto import DesignDTO
from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.interfaces.services.image_services import IPhotorealRenderService
from domain.mappers.project_mapper import to_design_dto
from domain.services.project_access import get_owned_design

RENDER_WINDOW = timedelta(hours=24)


class RequestPhotorealRenderUseCase:
    """Marks a design as rendering. The slow AI call runs afterwards in the background.

    A per-user daily cap keeps a public demo from running up an API bill.
    """

    def __init__(
        self,
        project_repo: IProjectRepository,
        design_repo: IDesignRepository,
        storage: IFileStorageService,
        photoreal: IPhotorealRenderService,
    ) -> None:
        self._project_repo = project_repo
        self._design_repo = design_repo
        self._storage = storage
        self._photoreal = photoreal

    def execute(self, design_id: str, user_id: str) -> DesignDTO:
        design, _ = get_owned_design(self._design_repo, self._project_repo, design_id, user_id)
        if not self._photoreal.is_available():
            raise AiNotConfiguredError("Photoreal rendering")
        if design.preview_path is None:
            raise InvalidAssignmentError("Apply at least one material before rendering")
        if design.render_status == RenderStatus.PENDING:
            raise RenderInProgressError

        now = datetime.now(UTC)
        limit = self._photoreal.daily_limit()
        if self._design_repo.count_renders_since(user_id, now - RENDER_WINDOW) >= limit:
            raise RenderLimitReachedError(limit)

        self._design_repo.record_render(user_id, design.id, now)
        pending = self._design_repo.update(
            replace(design, render_status=RenderStatus.PENDING, render_error=None, updated_at=now)
        )
        return to_design_dto(pending, self._storage.url_for)
