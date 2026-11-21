from fastapi import APIRouter, Depends

from domain.use_cases.design.delete_design_usecase import DeleteDesignUseCase
from domain.use_cases.design.get_design_usecase import GetDesignUseCase
from domain.use_cases.design.request_photoreal_render_usecase import RequestPhotorealRenderUseCase
from domain.use_cases.design.run_photoreal_render_usecase import RunPhotorealRenderUseCase
from domain.use_cases.design.update_design_usecase import UpdateDesignUseCase
from domain.use_cases.report.generate_design_report_usecase import GenerateDesignReportUseCase
from infrastructure.registry import InfrastructureRegistry
from presentation.controllers.design.delete_design_controller import DeleteDesignController
from presentation.controllers.design.get_design_controller import GetDesignController
from presentation.controllers.design.request_photoreal_render_controller import (
    RequestPhotorealRenderController,
)
from presentation.controllers.design.update_design_controller import UpdateDesignController
from presentation.controllers.estimate.download_design_report_controller import (
    DownloadDesignReportController,
)
from presentation.controllers.estimate.get_design_estimate_controller import (
    GetDesignEstimateController,
)
from presentation.routes.shared_wiring import SharedWiring
from presentation.schemas.estimate_schema import EstimateResponse
from presentation.schemas.project_schema import DesignResponse


def build_design_router(registry: InfrastructureRegistry, shared: SharedWiring) -> APIRouter:
    project_repo, design_repo, storage = (
        registry.project_repo,
        registry.design_repo,
        registry.storage,
    )

    get_design = GetDesignController(GetDesignUseCase(project_repo, design_repo, storage))
    update_design_use_case = UpdateDesignUseCase(
        project_repo, design_repo, registry.material_repo, storage, shared.render_preview
    )
    update_design = UpdateDesignController(update_design_use_case)
    delete_design = DeleteDesignController(DeleteDesignUseCase(project_repo, design_repo, storage))
    request_render_use_case = RequestPhotorealRenderUseCase(
        project_repo, design_repo, storage, registry.photoreal
    )
    run_render_use_case = RunPhotorealRenderUseCase(
        project_repo,
        design_repo,
        registry.material_repo,
        storage,
        registry.preview,
        registry.photoreal,
    )
    request_render = RequestPhotorealRenderController(request_render_use_case, run_render_use_case)
    get_estimate = GetDesignEstimateController(shared.get_estimate)
    generate_report_use_case = GenerateDesignReportUseCase(
        project_repo, design_repo, registry.user_repo, storage, registry.report, shared.get_estimate
    )
    download_report = DownloadDesignReportController(generate_report_use_case)

    router = APIRouter(
        prefix="/designs", tags=["Designs"], dependencies=[Depends(shared.auth.authenticate)]
    )
    router.add_api_route(
        "/{design_id}", get_design.handle, methods=["GET"], response_model=DesignResponse
    )
    router.add_api_route(
        "/{design_id}", update_design.handle, methods=["PUT"], response_model=DesignResponse
    )
    router.add_api_route(
        "/{design_id}",
        delete_design.handle,
        methods=["DELETE"],
        status_code=204,
        response_model=None,
    )
    router.add_api_route(
        "/{design_id}/render",
        request_render.handle,
        methods=["POST"],
        response_model=DesignResponse,
    )
    router.add_api_route(
        "/{design_id}/estimate",
        get_estimate.handle,
        methods=["GET"],
        response_model=EstimateResponse,
        tags=["Estimate"],
    )
    router.add_api_route(
        "/{design_id}/report",
        download_report.handle,
        methods=["GET"],
        response_model=None,
        tags=["Estimate"],
    )
    return router
