from fastapi import APIRouter, Depends

from domain.interfaces.dtos.auth_dto import DemoAccountDTO
from domain.use_cases.auth.guest_login_usecase import GuestLoginUseCase
from domain.use_cases.auth.login_usecase import LoginUseCase
from domain.use_cases.auth.register_usecase import RegisterUseCase
from infrastructure.registry import InfrastructureRegistry
from presentation.controllers.auth.get_demo_account_controller import GetDemoAccountController
from presentation.controllers.auth.get_me_controller import GetMeController
from presentation.controllers.auth.guest_login_controller import GuestLoginController
from presentation.controllers.auth.login_controller import LoginController
from presentation.controllers.auth.register_controller import RegisterController
from presentation.routes.shared_wiring import SharedWiring
from presentation.schemas.auth_schema import AuthResponse, DemoAccountResponse, UserResponse


def build_auth_router(
    registry: InfrastructureRegistry,
    shared: SharedWiring,
    demo_account: DemoAccountDTO | None = None,
) -> APIRouter:
    register_use_case = RegisterUseCase(
        registry.user_repo, registry.password_hasher, registry.token_service
    )
    login_use_case = LoginUseCase(
        registry.user_repo, registry.password_hasher, registry.token_service
    )
    guest_login_use_case = GuestLoginUseCase(registry.user_repo, registry.token_service)

    register_controller = RegisterController(register_use_case)
    login_controller = LoginController(login_use_case)
    guest_login_controller = GuestLoginController(guest_login_use_case)
    get_me_controller = GetMeController()
    demo_account_controller = GetDemoAccountController(demo_account)

    router = APIRouter(prefix="/auth", tags=["Auth"])
    router.add_api_route(
        "/register", register_controller.handle, methods=["POST"], response_model=AuthResponse
    )
    router.add_api_route(
        "/login", login_controller.handle, methods=["POST"], response_model=AuthResponse
    )
    router.add_api_route(
        "/guest", guest_login_controller.handle, methods=["POST"], response_model=AuthResponse
    )
    router.add_api_route(
        "/demo-account",
        demo_account_controller.handle,
        methods=["GET"],
        response_model=DemoAccountResponse | None,
    )
    router.add_api_route(
        "/me",
        get_me_controller.handle,
        methods=["GET"],
        response_model=UserResponse,
        dependencies=[Depends(shared.auth.authenticate)],
    )
    return router
