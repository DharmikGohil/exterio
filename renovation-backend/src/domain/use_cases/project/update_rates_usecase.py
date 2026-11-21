from dataclasses import replace
from datetime import UTC, datetime

from domain.entities.project_entity import RateOverride
from domain.errors.project_errors import InvalidRateError
from domain.interfaces.dtos.project_dto import ProjectDTO
from domain.interfaces.repos.material_repo import IMaterialRepository
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.services.project_access import get_owned_project
from domain.use_cases.project.project_reader import ProjectReader

MAX_WASTAGE_PCT = 100.0


class UpdateRatesUseCase:
    """Replaces the project's rate card overrides. Costs recalculate on the next read."""

    def __init__(
        self,
        project_repo: IProjectRepository,
        material_repo: IMaterialRepository,
        reader: ProjectReader,
    ) -> None:
        self._project_repo = project_repo
        self._material_repo = material_repo
        self._reader = reader

    def execute(
        self, project_id: str, user_id: str, overrides: dict[str, RateOverride]
    ) -> ProjectDTO:
        project = get_owned_project(self._project_repo, project_id, user_id)
        cleaned: dict[str, RateOverride] = {}
        for material_id, override in overrides.items():
            if self._material_repo.find_by_id(material_id) is None:
                raise InvalidRateError(f"Unknown material '{material_id}'")
            self._validate(override)
            if override != RateOverride():
                cleaned[material_id] = override
        updated = self._project_repo.update(
            replace(project, rate_overrides=cleaned, updated_at=datetime.now(UTC))
        )
        return self._reader.to_dto(updated)

    @staticmethod
    def _validate(override: RateOverride) -> None:
        for rate in (override.material_rate, override.labour_rate):
            if rate is not None and rate < 0:
                raise InvalidRateError("Rates cannot be negative")
        wastage = override.wastage_pct
        if wastage is not None and not 0 <= wastage <= MAX_WASTAGE_PCT:
            raise InvalidRateError(f"Wastage must be between 0 and {MAX_WASTAGE_PCT:g} percent")
