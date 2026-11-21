import logging
from collections import OrderedDict
from datetime import datetime

from domain.entities.design_entity import Design
from domain.entities.project_entity import Project
from domain.interfaces.dtos.project_dto import ProjectSummaryDTO
from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.repos.material_repo import IMaterialRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.services.file_storage_service import IFileStorageService
from domain.mappers.project_mapper import to_project_summary_dto
from domain.services.estimate_builder import build_estimate
from domain.services.project_progress import latest_priced_design, project_progress
from domain.use_cases.estimate.measure_facade_usecase import MeasureFacadeUseCase

logger = logging.getLogger(__name__)

# Totals already worked out, keyed by what they depend on; old keys simply stop being asked for.
TotalKey = tuple[str, datetime, str, datetime]
MAX_REMEMBERED_TOTALS = 512


class ListProjectsUseCase:
    """Every house of a user, with how far along it is and, once it has one, its estimate total.

    The total is that of the most recently edited design with finishes. Measuring a facade is the
    slow part of an estimate, so each total is remembered until the project or the design changes.
    """

    def __init__(
        self,
        project_repo: IProjectRepository,
        design_repo: IDesignRepository,
        material_repo: IMaterialRepository,
        storage: IFileStorageService,
        measure_facade: MeasureFacadeUseCase,
    ) -> None:
        self._project_repo = project_repo
        self._design_repo = design_repo
        self._material_repo = material_repo
        self._storage = storage
        self._measure_facade = measure_facade
        self._totals: OrderedDict[TotalKey, float] = OrderedDict()

    def execute(self, user_id: str) -> list[ProjectSummaryDTO]:
        summaries = []
        for project in self._project_repo.find_all_by_user(user_id):
            designs = self._design_repo.find_all_by_project(project.id)
            progress = project_progress(project, designs)
            design = latest_priced_design(project, designs) if progress.has_estimate else None
            summaries.append(
                to_project_summary_dto(
                    project,
                    designs,
                    progress,
                    self._total_for(project, design) if design else None,
                    self._storage.url_for,
                )
            )
        return summaries

    def _total_for(self, project: Project, design: Design) -> float | None:
        key = (project.id, project.updated_at, design.id, design.updated_at)
        if key in self._totals:
            self._totals.move_to_end(key)
            return self._totals[key]
        try:
            reference, surface, _ = self._measure_facade.execute(project)
            materials = {material.id: material for material in self._material_repo.find_all()}
            total = build_estimate(
                project, design, reference, surface, materials
            ).totals.grand_total
        except Exception:
            # The list must still load; the studio shows the real error when the house is opened.
            logger.exception("Could not work out the estimate total for project %s", project.id)
            return None
        self._totals[key] = total
        if len(self._totals) > MAX_REMEMBERED_TOTALS:
            self._totals.popitem(last=False)
        return total
