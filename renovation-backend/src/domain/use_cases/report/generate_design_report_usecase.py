from dataclasses import dataclass
from datetime import UTC, datetime

from domain.errors.project_errors import ImageRequiredError
from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.repos.user_repo import IUserRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.interfaces.services.report_service import IReportService, ReportData
from domain.services.project_access import get_owned_design
from domain.use_cases.estimate.get_design_estimate_usecase import GetDesignEstimateUseCase

PHOTOREAL_CAPTION = "Redesigned (AI photoreal render)"
PREVIEW_CAPTION = "Redesigned (material preview)"


@dataclass(frozen=True)
class GeneratedReport:
    filename: str
    content: bytes


class GenerateDesignReportUseCase:
    """Builds the PDF a homeowner can take to a contractor."""

    def __init__(
        self,
        project_repo: IProjectRepository,
        design_repo: IDesignRepository,
        user_repo: IUserRepository,
        storage: IFileStorageService,
        report: IReportService,
        get_estimate: GetDesignEstimateUseCase,
    ) -> None:
        self._project_repo = project_repo
        self._design_repo = design_repo
        self._user_repo = user_repo
        self._storage = storage
        self._report = report
        self._get_estimate = get_estimate

    def execute(self, design_id: str, user_id: str) -> GeneratedReport:
        design, project = get_owned_design(
            self._design_repo, self._project_repo, design_id, user_id
        )
        if project.image is None:
            raise ImageRequiredError
        estimate = self._get_estimate.execute(design_id, user_id)
        user = self._user_repo.find_by_id(user_id)

        redesigned_path = design.render_path or design.preview_path
        content = self._report.build(
            ReportData(
                project_name=project.name,
                design_name=design.name,
                prepared_for=user.name if user is not None else "Homeowner",
                generated_at=datetime.now(UTC),
                original_image=self._storage.read(project.image.path),
                redesigned_image=self._storage.read(redesigned_path) if redesigned_path else None,
                redesigned_caption=PHOTOREAL_CAPTION if design.render_path else PREVIEW_CAPTION,
                estimate=estimate,
            )
        )
        slug = "".join(char if char.isalnum() else "-" for char in project.name.lower()).strip("-")
        return GeneratedReport(filename=f"renovation-report-{slug or 'house'}.pdf", content=content)
