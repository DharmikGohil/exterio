from dataclasses import replace
from datetime import UTC, datetime
from uuid import uuid4

from domain.entities.design_entity import Design, RenderStatus
from domain.entities.material_entity import Material
from domain.entities.project_entity import Project
from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.repos.material_repo import IMaterialRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.interfaces.services.image_services import IPreviewRenderService, PreviewRequest
from domain.use_cases.estimate.measure_facade_usecase import MeasureFacadeUseCase

TOKEN_LENGTH = 8


def new_file_token() -> str:
    """Short random suffix so a changed file gets a new, cache-safe URL."""
    return uuid4().hex[:TOKEN_LENGTH]


class RenderDesignPreviewUseCase:
    """Re-renders the instant preview of a design and stores it.

    Any photoreal render is discarded because it no longer matches the design.
    """

    def __init__(
        self,
        design_repo: IDesignRepository,
        material_repo: IMaterialRepository,
        storage: IFileStorageService,
        preview: IPreviewRenderService,
        measure_facade: MeasureFacadeUseCase,
    ) -> None:
        self._design_repo = design_repo
        self._material_repo = material_repo
        self._storage = storage
        self._preview = preview
        self._measure_facade = measure_facade

    def execute(self, project: Project, design: Design) -> Design:
        self._discard_files(design)
        materials_by_region = self._materials_by_region(project, design)
        preview_path = None
        if project.image is not None and materials_by_region:
            preview_path = self._render(project, design, materials_by_region)
        return self._design_repo.update(
            replace(
                design,
                assignments={key: value.id for key, value in materials_by_region.items()},
                preview_path=preview_path,
                render_path=None,
                render_status=RenderStatus.NONE,
                render_error=None,
                updated_at=datetime.now(UTC),
            )
        )

    def _materials_by_region(self, project: Project, design: Design) -> dict[str, Material]:
        """Drop assignments that point at deleted regions, unknown or unsuitable materials."""
        labels = {region.id: region.label for region in project.regions}
        resolved: dict[str, Material] = {}
        for region_id, material_id in design.assignments.items():
            material = self._material_repo.find_by_id(material_id)
            label = labels.get(region_id)
            if material is not None and label is not None and material.can_apply_to(label):
                resolved[region_id] = material
        return resolved

    def _render(
        self, project: Project, design: Design, materials_by_region: dict[str, Material]
    ) -> str:
        assert project.image is not None
        reference, surface, scale = self._measure_facade.execute(project)
        image = self._preview.render(
            PreviewRequest(
                image=self._storage.read(project.image.path),
                regions=project.regions,
                materials_by_region=materials_by_region,
                facade_corners=reference.facade_corners,
                facade_width_ft=surface.facade_width_px * scale.feet_per_pixel_x,
                facade_height_ft=surface.facade_height_px * scale.feet_per_pixel_y,
            )
        )
        path = f"projects/{project.id}/designs/{design.id}/preview-{new_file_token()}.jpg"
        self._storage.save(path, image)
        return path

    def _discard_files(self, design: Design) -> None:
        for path in (design.preview_path, design.render_path):
            if path:
                self._storage.delete(path)
