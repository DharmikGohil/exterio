from datetime import UTC, datetime
from uuid import uuid4

from domain.entities.design_entity import Design
from domain.errors.project_errors import DesignNotFoundError
from domain.interfaces.dtos.project_dto import DesignDTO
from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.mappers.project_mapper import to_design_dto
from domain.services.project_access import get_owned_project
from domain.use_cases.design.render_design_preview_usecase import RenderDesignPreviewUseCase

MAX_DESIGN_NAME_LENGTH = 60
MAX_DESIGNS_PER_PROJECT = 12


def clean_design_name(name: str, fallback: str) -> str:
    return name.strip()[:MAX_DESIGN_NAME_LENGTH] or fallback


class CreateDesignUseCase:
    """Creates an empty design, or a copy of another one to try a variation."""

    def __init__(
        self,
        project_repo: IProjectRepository,
        design_repo: IDesignRepository,
        storage: IFileStorageService,
        render_preview: RenderDesignPreviewUseCase,
    ) -> None:
        self._project_repo = project_repo
        self._design_repo = design_repo
        self._storage = storage
        self._render_preview = render_preview

    def execute(
        self, project_id: str, user_id: str, name: str, copy_from_design_id: str | None
    ) -> DesignDTO:
        project = get_owned_project(self._project_repo, project_id, user_id)
        existing = self._design_repo.find_all_by_project(project.id)

        assignments: dict[str, str] = {}
        if copy_from_design_id:
            source = next((item for item in existing if item.id == copy_from_design_id), None)
            if source is None:
                raise DesignNotFoundError
            assignments = dict(source.assignments)

        now = datetime.now(UTC)
        design = self._design_repo.create(
            Design(
                id=str(uuid4()),
                project_id=project.id,
                name=clean_design_name(name, f"Design {len(existing) + 1}"),
                created_at=now,
                updated_at=now,
                assignments=assignments,
            )
        )
        if assignments:
            design = self._render_preview.execute(project, design)
        return to_design_dto(design, self._storage.url_for)
