from datetime import UTC, datetime
from uuid import uuid4

from domain.entities.design_entity import Design
from domain.entities.project_entity import Project, ProjectImage
from domain.interfaces.dtos.project_dto import ProjectDTO
from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.interfaces.services.image_services import (
    IImageInspectionService,
    ISampleHouseProvider,
    SampleStage,
)
from domain.mappers.project_mapper import thumbnail_path
from domain.use_cases.design.render_design_preview_usecase import (
    RenderDesignPreviewUseCase,
    new_file_token,
)
from domain.use_cases.project.project_reader import ProjectReader
from domain.use_cases.project.upload_project_image_usecase import THUMBNAIL_SIDE


class CreateSampleProjectUseCase:
    """Creates a finished demo house so the whole flow can be seen without a photo."""

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

    def execute(self, user_id: str, key: str | None = None) -> ProjectDTO:
        """The sample with this key; without one, the first sample the user does not have yet."""
        return self._create(user_id, key or self._next_key(user_id))

    def execute_all(self, user_id: str) -> list[ProjectDTO]:
        """Every sample, in order: what a fresh demo account starts with."""
        return [self._create(user_id, sample.key) for sample in self._sample_house.samples()]

    def _next_key(self, user_id: str) -> str:
        samples = self._sample_house.samples()
        owned = {project.name for project in self._project_repo.find_all_by_user(user_id)}
        return next((sample.key for sample in samples if sample.name not in owned), samples[0].key)

    def _create(self, user_id: str, key: str) -> ProjectDTO:
        sample = self._sample_house.build(key)
        # Each sample is created as far along as its stage, so between them they show every
        # step: a bare photo, marked parts, a set size, a finished design.
        has_parts = sample.stage != SampleStage.PHOTO
        has_size = sample.stage in (SampleStage.SIZE, SampleStage.FINISHED)
        is_finished = sample.stage == SampleStage.FINISHED
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
                name=sample.name,
                created_at=now,
                updated_at=now,
                image=ProjectImage(path, prepared.width, prepared.height, prepared.report),
                regions=sample.regions if has_parts else (),
                scale=sample.scale if has_size else None,
            )
        )
        design = self._design_repo.create(
            Design(
                id=str(uuid4()),
                project_id=project.id,
                name=sample.design_name,
                created_at=now,
                updated_at=now,
                assignments=dict(sample.assignments) if is_finished else {},
            )
        )
        self._render_preview.execute(project, design)
        return self._reader.to_dto(project)
