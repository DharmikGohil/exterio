from dataclasses import replace
from datetime import UTC, datetime

from domain.entities.project_entity import IssueSeverity, ProjectImage, QualityReport
from domain.errors.project_errors import ImageRejectedError, ImageTooLargeError
from domain.interfaces.dtos.project_dto import ProjectDTO
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.interfaces.services.image_services import (
    IImageInspectionService,
    IVisionCheckService,
    PreparedImage,
)
from domain.mappers.project_mapper import thumbnail_path
from domain.services.project_access import get_owned_project
from domain.use_cases.design.render_design_preview_usecase import new_file_token
from domain.use_cases.project.project_reader import ProjectReader
from domain.use_cases.project.project_refresher import ProjectRefresher

BYTES_PER_MB = 1024 * 1024
THUMBNAIL_SIDE = 480
VISION_ERROR_PENALTY = 40
VISION_WARNING_PENALTY = 10
# A photo that cannot be used must not look like a passing grade.
MAX_SCORE_WHEN_UNUSABLE = 30


class UploadProjectImageUseCase:
    """Accepts a house photo: quality gate, storage, and a clean slate for regions.

    Cheap pixel heuristics run first. The vision model is only consulted for
    photos that pass them, so obviously bad uploads cost nothing.
    """

    def __init__(
        self,
        project_repo: IProjectRepository,
        storage: IFileStorageService,
        inspection: IImageInspectionService,
        vision: IVisionCheckService,
        reader: ProjectReader,
        refresher: ProjectRefresher,
    ) -> None:
        self._project_repo = project_repo
        self._storage = storage
        self._inspection = inspection
        self._vision = vision
        self._reader = reader
        self._refresher = refresher

    def execute(self, project_id: str, user_id: str, raw: bytes) -> ProjectDTO:
        project = get_owned_project(self._project_repo, project_id, user_id)
        max_mb = self._inspection.max_upload_mb()
        if len(raw) > max_mb * BYTES_PER_MB:
            raise ImageTooLargeError(max_mb)

        prepared = self._inspection.prepare(raw)
        report = self._with_vision_check(prepared)
        if not report.usable:
            raise ImageRejectedError({"quality": report})

        if project.image is not None:
            self._storage.delete(project.image.path)
        path = f"projects/{project.id}/original-{new_file_token()}.jpg"
        self._storage.save(path, prepared.data)
        self._storage.save(
            thumbnail_path(project.id), self._inspection.thumbnail(prepared.data, THUMBNAIL_SIDE)
        )

        updated = self._project_repo.update(
            replace(
                project,
                image=ProjectImage(path, prepared.width, prepared.height, report),
                regions=(),
                scale=None,
                updated_at=datetime.now(UTC),
            )
        )
        self._refresher.refresh_designs(updated)
        return self._reader.to_dto(updated)

    def _with_vision_check(self, prepared: PreparedImage) -> QualityReport:
        report = prepared.report
        if not report.usable or not self._vision.is_available():
            return report
        verdict = self._vision.check(prepared.data)
        errors = sum(1 for issue in verdict.issues if issue.severity == IssueSeverity.ERROR)
        warnings = len(verdict.issues) - errors
        penalty = errors * VISION_ERROR_PENALTY + warnings * VISION_WARNING_PENALTY
        score = max(report.score - penalty, 0)
        if errors:
            score = min(score, MAX_SCORE_WHEN_UNUSABLE)
        return replace(
            report,
            usable=errors == 0,
            score=score,
            issues=(*report.issues, *verdict.issues),
            guidance=(*report.guidance, *verdict.guidance),
        )
