from fastapi import APIRouter, Depends

from domain.use_cases.material.list_materials_usecase import ListMaterialsUseCase
from domain.use_cases.system.get_capabilities_usecase import GetCapabilitiesUseCase
from infrastructure.registry import InfrastructureRegistry
from presentation.controllers.material.list_materials_controller import ListMaterialsController
from presentation.controllers.system.get_capabilities_controller import GetCapabilitiesController
from presentation.routes.shared_wiring import SharedWiring
from presentation.schemas.project_schema import CapabilitiesResponse, MaterialResponse


def build_catalog_router(registry: InfrastructureRegistry, shared: SharedWiring) -> APIRouter:
    list_materials_use_case = ListMaterialsUseCase(registry.material_repo, registry.storage)
    get_capabilities_use_case = GetCapabilitiesUseCase(
        registry.segmentation, registry.photoreal, registry.vision, registry.advisor_model
    )

    list_materials_controller = ListMaterialsController(list_materials_use_case)
    get_capabilities_controller = GetCapabilitiesController(get_capabilities_use_case)

    router = APIRouter(dependencies=[Depends(shared.auth.authenticate)])
    router.add_api_route(
        "/materials",
        list_materials_controller.handle,
        methods=["GET"],
        response_model=list[MaterialResponse],
        tags=["Materials"],
    )
    router.add_api_route(
        "/system/capabilities",
        get_capabilities_controller.handle,
        methods=["GET"],
        response_model=CapabilitiesResponse,
        tags=["System"],
    )
    return router
