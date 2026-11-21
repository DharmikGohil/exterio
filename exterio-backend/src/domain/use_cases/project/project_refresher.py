from domain.entities.project_entity import Project
from domain.interfaces.repos.design_repo import IDesignRepository
from domain.use_cases.design.render_design_preview_usecase import RenderDesignPreviewUseCase


class ProjectRefresher:
    """Re-renders every design preview after the photo, regions or scale change."""

    def __init__(
        self, design_repo: IDesignRepository, render_preview: RenderDesignPreviewUseCase
    ) -> None:
        self._design_repo = design_repo
        self._render_preview = render_preview

    def refresh_designs(self, project: Project) -> None:
        for design in self._design_repo.find_all_by_project(project.id):
            self._render_preview.execute(project, design)
