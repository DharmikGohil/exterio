from dataclasses import replace

from domain.entities.project_entity import Project
from domain.errors.project_errors import InvalidAssignmentError
from domain.interfaces.dtos.project_dto import DesignDTO
from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.repos.material_repo import IMaterialRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.mappers.project_mapper import to_design_dto
from domain.services.project_access import get_owned_design
from domain.use_cases.design.create_design_usecase import clean_design_name
from domain.use_cases.design.render_design_preview_usecase import RenderDesignPreviewUseCase


class UpdateDesignUseCase:
    """Renames a design and/or changes which material goes on which region."""

    def __init__(
        self,
        project_repo: IProjectRepository,
        design_repo: IDesignRepository,
        material_repo: IMaterialRepository,
        storage: IFileStorageService,
        render_preview: RenderDesignPreviewUseCase,
    ) -> None:
        self._project_repo = project_repo
        self._design_repo = design_repo
        self._material_repo = material_repo
        self._storage = storage
        self._render_preview = render_preview

    def execute(
        self, design_id: str, user_id: str, name: str | None, assignments: dict[str, str] | None
    ) -> DesignDTO:
        design, project = get_owned_design(
            self._design_repo, self._project_repo, design_id, user_id
        )
        if name is not None:
            design = replace(design, name=clean_design_name(name, design.name))
        if assignments is None:
            design = self._design_repo.update(design)
        else:
            self._validate(project, assignments)
            design = self._render_preview.execute(project, replace(design, assignments=assignments))
        return to_design_dto(design, self._storage.url_for)

    def _validate(self, project: Project, assignments: dict[str, str]) -> None:
        regions = {region.id: region for region in project.regions}
        for region_id, material_id in assignments.items():
            region = regions.get(region_id)
            material = self._material_repo.find_by_id(material_id)
            if region is None:
                raise InvalidAssignmentError("A selected region no longer exists")
            if material is None:
                raise InvalidAssignmentError(f"Unknown material '{material_id}'")
            if not material.can_apply_to(region.label):
                raise InvalidAssignmentError(
                    f"{material.name} cannot be applied to a {region.label.replace('_', ' ')}"
                )
