"""Collaborators that several route modules need, built once from the registry."""

from dataclasses import dataclass

from domain.use_cases.auth.get_current_user_usecase import GetCurrentUserUseCase
from domain.use_cases.design.render_design_preview_usecase import RenderDesignPreviewUseCase
from domain.use_cases.estimate.get_design_estimate_usecase import GetDesignEstimateUseCase
from domain.use_cases.estimate.measure_facade_usecase import MeasureFacadeUseCase
from domain.use_cases.project.create_sample_project_usecase import CreateSampleProjectUseCase
from domain.use_cases.project.project_reader import ProjectReader
from domain.use_cases.project.project_refresher import ProjectRefresher
from infrastructure.registry import InfrastructureRegistry
from presentation.middleware.auth_middleware import AuthMiddleware


@dataclass(frozen=True)
class SharedWiring:
    auth: AuthMiddleware
    reader: ProjectReader
    refresher: ProjectRefresher
    measure_facade: MeasureFacadeUseCase
    render_preview: RenderDesignPreviewUseCase
    get_estimate: GetDesignEstimateUseCase
    create_sample_project: CreateSampleProjectUseCase


def build_shared_wiring(registry: InfrastructureRegistry) -> SharedWiring:
    get_current_user = GetCurrentUserUseCase(registry.user_repo, registry.token_service)
    measure_facade = MeasureFacadeUseCase(registry.measurement)
    render_preview = RenderDesignPreviewUseCase(
        registry.design_repo,
        registry.material_repo,
        registry.storage,
        registry.preview,
        measure_facade,
    )
    get_estimate = GetDesignEstimateUseCase(
        registry.project_repo, registry.design_repo, registry.material_repo, measure_facade
    )
    reader = ProjectReader(registry.design_repo, registry.storage)
    create_sample_project = CreateSampleProjectUseCase(
        registry.project_repo,
        registry.design_repo,
        registry.storage,
        registry.inspection,
        registry.sample_house,
        render_preview,
        reader,
    )
    return SharedWiring(
        auth=AuthMiddleware(get_current_user),
        reader=reader,
        refresher=ProjectRefresher(registry.design_repo, render_preview),
        measure_facade=measure_facade,
        render_preview=render_preview,
        get_estimate=get_estimate,
        create_sample_project=create_sample_project,
    )
