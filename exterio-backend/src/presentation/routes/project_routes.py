from fastapi import APIRouter, Depends, status

from domain.use_cases.design.create_design_usecase import CreateDesignUseCase
from domain.use_cases.project.create_project_usecase import CreateProjectUseCase
from domain.use_cases.project.delete_project_usecase import DeleteProjectUseCase
from domain.use_cases.project.get_project_usecase import GetProjectUseCase
from domain.use_cases.project.list_projects_usecase import ListProjectsUseCase
from domain.use_cases.project.rename_project_usecase import RenameProjectUseCase
from domain.use_cases.project.update_rates_usecase import UpdateRatesUseCase
from domain.use_cases.project.update_scale_usecase import UpdateScaleUseCase
from domain.use_cases.project.upload_project_image_usecase import UploadProjectImageUseCase
from domain.use_cases.region.detect_regions_usecase import DetectRegionsUseCase
from domain.use_cases.region.replace_regions_usecase import ReplaceRegionsUseCase
from infrastructure.registry import InfrastructureRegistry
from presentation.controllers.design.create_design_controller import CreateDesignController
from presentation.controllers.project.create_project_controller import CreateProjectController
from presentation.controllers.project.create_sample_project_controller import (
    CreateSampleProjectController,
)
from presentation.controllers.project.delete_project_controller import DeleteProjectController
from presentation.controllers.project.get_project_controller import GetProjectController
from presentation.controllers.project.list_projects_controller import ListProjectsController
from presentation.controllers.project.rename_project_controller import RenameProjectController
from presentation.controllers.project.update_rates_controller import UpdateRatesController
from presentation.controllers.project.update_scale_controller import UpdateScaleController
from presentation.controllers.project.upload_project_image_controller import (
    UploadProjectImageController,
)
from presentation.controllers.region.detect_regions_controller import DetectRegionsController
from presentation.controllers.region.replace_regions_controller import ReplaceRegionsController
from presentation.routes.shared_wiring import SharedWiring
from presentation.schemas.project_schema import (
    DesignResponse,
    ProjectResponse,
    ProjectSummaryResponse,
)


def build_project_router(registry: InfrastructureRegistry, shared: SharedWiring) -> APIRouter:
    project_repo, design_repo, storage = (
        registry.project_repo,
        registry.design_repo,
        registry.storage,
    )
    reader, refresher = shared.reader, shared.refresher

    create_project = CreateProjectController(CreateProjectUseCase(project_repo, reader))
    create_sample = CreateSampleProjectController(shared.create_sample_project)
    list_projects = ListProjectsController(ListProjectsUseCase(project_repo, design_repo, storage))
    get_project = GetProjectController(GetProjectUseCase(project_repo, reader))
    rename_project = RenameProjectController(RenameProjectUseCase(project_repo, reader))
    delete_project = DeleteProjectController(
        DeleteProjectUseCase(project_repo, design_repo, storage)
    )
    upload_image_use_case = UploadProjectImageUseCase(
        project_repo, storage, registry.inspection, registry.vision, reader, refresher
    )
    upload_image = UploadProjectImageController(upload_image_use_case)
    detect_regions_use_case = DetectRegionsUseCase(
        project_repo, storage, registry.segmentation, reader, refresher
    )
    detect_regions = DetectRegionsController(detect_regions_use_case)
    replace_regions = ReplaceRegionsController(
        ReplaceRegionsUseCase(project_repo, reader, refresher)
    )
    update_scale = UpdateScaleController(UpdateScaleUseCase(project_repo, reader, refresher))
    update_rates = UpdateRatesController(
        UpdateRatesUseCase(project_repo, registry.material_repo, reader)
    )
    create_design_use_case = CreateDesignUseCase(
        project_repo, design_repo, storage, shared.render_preview
    )
    create_design = CreateDesignController(create_design_use_case)

    router = APIRouter(
        prefix="/projects", tags=["Projects"], dependencies=[Depends(shared.auth.authenticate)]
    )
    created = status.HTTP_201_CREATED
    router.add_api_route(
        "", list_projects.handle, methods=["GET"], response_model=list[ProjectSummaryResponse]
    )
    router.add_api_route(
        "",
        create_project.handle,
        methods=["POST"],
        status_code=created,
        response_model=ProjectResponse,
    )
    router.add_api_route(
        "/sample",
        create_sample.handle,
        methods=["POST"],
        status_code=created,
        response_model=ProjectResponse,
    )
    router.add_api_route(
        "/{project_id}", get_project.handle, methods=["GET"], response_model=ProjectResponse
    )
    router.add_api_route(
        "/{project_id}", rename_project.handle, methods=["PATCH"], response_model=ProjectResponse
    )
    router.add_api_route(
        "/{project_id}",
        delete_project.handle,
        methods=["DELETE"],
        status_code=204,
        response_model=None,
    )
    router.add_api_route(
        "/{project_id}/image", upload_image.handle, methods=["POST"], response_model=ProjectResponse
    )
    router.add_api_route(
        "/{project_id}/regions/detect",
        detect_regions.handle,
        methods=["POST"],
        response_model=ProjectResponse,
    )
    router.add_api_route(
        "/{project_id}/regions",
        replace_regions.handle,
        methods=["PUT"],
        response_model=ProjectResponse,
    )
    router.add_api_route(
        "/{project_id}/scale", update_scale.handle, methods=["PUT"], response_model=ProjectResponse
    )
    router.add_api_route(
        "/{project_id}/rates", update_rates.handle, methods=["PUT"], response_model=ProjectResponse
    )
    router.add_api_route(
        "/{project_id}/designs",
        create_design.handle,
        methods=["POST"],
        status_code=created,
        response_model=DesignResponse,
        tags=["Designs"],
    )
    return router
