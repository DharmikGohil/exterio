from dataclasses import replace
from datetime import UTC, datetime

from domain.entities.design_entity import Design, RenderStatus
from domain.entities.project_entity import Project
from domain.errors.base_error import DomainError
from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.repos.material_repo import IMaterialRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.interfaces.services.image_services import (
    IPhotorealRenderService,
    IPreviewRenderService,
    RenderFinish,
)
from domain.use_cases.design.render_design_preview_usecase import new_file_token

GENERIC_FAILURE = "The photoreal render could not be completed. The instant preview is still valid."


class RunPhotorealRenderUseCase:
    """Background half of the photoreal render.

    1. Send the instant preview and the finishes to the image model, which adds realism only.
    2. Paste the original pixels back everywhere outside the edited regions, so
       the building structure is preserved by construction, not by hope.
    """

    def __init__(
        self,
        project_repo: IProjectRepository,
        design_repo: IDesignRepository,
        material_repo: IMaterialRepository,
        storage: IFileStorageService,
        preview: IPreviewRenderService,
        photoreal: IPhotorealRenderService,
    ) -> None:
        self._project_repo = project_repo
        self._design_repo = design_repo
        self._material_repo = material_repo
        self._storage = storage
        self._preview = preview
        self._photoreal = photoreal

    def execute(self, design_id: str) -> None:
        design = self._design_repo.find_by_id(design_id)
        if design is None or design.render_status != RenderStatus.PENDING:
            return
        project = self._project_repo.find_by_id(design.project_id)
        if project is None or project.image is None or design.preview_path is None:
            self._finish(design, None, GENERIC_FAILURE)
            return
        try:
            path = self._render(project, design)
        except DomainError as error:
            self._finish(design, None, error.message)
        except Exception:
            self._finish(design, None, GENERIC_FAILURE)
            raise
        else:
            self._finish(design, path, None)

    def _render(self, project: Project, design: Design) -> str:
        assert project.image is not None
        assert design.preview_path is not None
        composite = self._storage.read(design.preview_path)
        edited = self._photoreal.render(composite, self._finishes(project, design))
        merged = self._preview.merge_with_original(
            self._storage.read(project.image.path),
            edited,
            project.regions,
            frozenset(design.assignments),
        )
        path = f"projects/{project.id}/designs/{design.id}/render-{new_file_token()}.jpg"
        self._storage.save(path, merged)
        return path

    def _finishes(self, project: Project, design: Design) -> tuple[RenderFinish, ...]:
        # A dict keeps the first-seen order while dropping repeats (seven walls, one paint).
        finishes: dict[RenderFinish, None] = {}
        for region in project.regions:
            material = self._material_repo.find_by_id(design.assignments.get(region.id, ""))
            if material is not None:
                surface = region.label.replace("_", " ")
                finishes[RenderFinish(surface, material.name, material.description)] = None
        return tuple(finishes)

    def _finish(self, design: Design, path: str | None, error: str | None) -> None:
        current = self._design_repo.find_by_id(design.id)
        if current is None or current.render_status != RenderStatus.PENDING:
            # The design changed while rendering; this result is stale.
            if path:
                self._storage.delete(path)
            return
        self._design_repo.update(
            replace(
                current,
                render_path=path,
                render_status=RenderStatus.DONE if path else RenderStatus.FAILED,
                render_error=error,
                updated_at=datetime.now(UTC),
            )
        )
