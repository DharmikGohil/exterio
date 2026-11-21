from domain.interfaces.dtos.estimate_dto import EstimateDTO
from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.repos.material_repo import IMaterialRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.services.estimate_builder import build_estimate
from domain.services.project_access import get_owned_design
from domain.use_cases.estimate.measure_facade_usecase import MeasureFacadeUseCase


class GetDesignEstimateUseCase:
    """Areas, quantities and costs for one design. Always computed on read."""

    def __init__(
        self,
        project_repo: IProjectRepository,
        design_repo: IDesignRepository,
        material_repo: IMaterialRepository,
        measure_facade: MeasureFacadeUseCase,
    ) -> None:
        self._project_repo = project_repo
        self._design_repo = design_repo
        self._material_repo = material_repo
        self._measure_facade = measure_facade

    def execute(self, design_id: str, user_id: str) -> EstimateDTO:
        design, project = get_owned_design(
            self._design_repo, self._project_repo, design_id, user_id
        )
        reference, surface, _ = self._measure_facade.execute(project)
        materials = {material.id: material for material in self._material_repo.find_all()}
        return build_estimate(project, design, reference, surface, materials)
