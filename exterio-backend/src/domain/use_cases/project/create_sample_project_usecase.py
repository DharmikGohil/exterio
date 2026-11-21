from datetime import UTC, datetime
from uuid import uuid4

from domain.entities.design_entity import Design
from domain.entities.project_entity import Project, ProjectImage
from domain.interfaces.dtos.project_dto import ProjectDTO
from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.interfaces.services.image_services import IImageInspectionService, ISampleHouseProvider
from domain.mappers.project_mapper import thumbnail_path
from domain.use_cases.design.render_design_preview_usecase import (
    RenderDesignPreviewUseCase,
    new_file_token,
)
from domain.use_cases.project.project_reader import ProjectReader
from domain.use_cases.project.upload_project_image_usecase import THUMBNAIL_SIDE

SAMPLE_PROJECT_NAME = "Sample house"
SAMPLE_DESIGN_NAME = "Warm stone and cream"


class CreateSampleProjectUseCase:
    """Creates a finished demo project so the whole flow can be seen without a photo."""

    def __init__(
        self,
        project_repo: IProjectRepository,
        design_repo: IDesignRepository,
        storage: IFileStorageService,
        inspection: IImageInspectionService,
        sample_house: ISampleHouseProvider,
        render_preview: RenderDesignPreviewUseCase,
        reader: ProjectReader,
    ) -> None:
        self._project_repo = project_repo
        self._design_repo = design_repo
        self._storage = storage
        self._inspection = inspection
        self._sample_house = sample_house
        self._render_preview = render_preview
        self._reader = reader

    def execute(self, user_id: str) -> ProjectDTO:
        sample = self._sample_house.build()
        prepared = self._inspection.prepare(sample.image)
        now = datetime.now(UTC)
        project_id = str(uuid4())

        path = f"projects/{project_id}/original-{new_file_token()}.jpg"
        self._storage.save(path, prepared.data)
        self._storage.save(
            thumbnail_path(project_id), self._inspection.thumbnail(prepared.data, THUMBNAIL_SIDE)
        )
        project = self._project_repo.create(
            Project(
                id=project_id,
                user_id=user_id,
                name=SAMPLE_PROJECT_NAME,
                created_at=now,
                updated_at=now,
                image=ProjectImage(path, prepared.width, prepared.height, prepared.report),
                regions=sample.regions,
                scale=sample.scale,
            )
        )
        assignments = {
            region.id: sample.material_by_label[region.label]
            for region in sample.regions
            if region.label in sample.material_by_label
        }
        design = self._design_repo.create(
            Design(
                id=str(uuid4()),
                project_id=project.id,
                name=SAMPLE_DESIGN_NAME,
                created_at=now,
                updated_at=now,
                assignments=assignments,
            )
        )
        self._render_preview.execute(project, design)
        return self._reader.to_dto(project)
