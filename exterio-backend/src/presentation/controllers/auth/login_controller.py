from domain.interfaces.dtos.auth_dto import LoginRequestDTO
from domain.use_cases.auth.login_usecase import LoginUseCase
from presentation.schemas.auth_schema import AuthResponse, LoginRequest


class LoginController:
    def __init__(self, login: LoginUseCase) -> None:
        self._login = login

    def handle(self, body: LoginRequest) -> AuthResponse:
        result = self._login.execute(LoginRequestDTO(email=body.email, password=body.password))
        return AuthResponse.model_validate(result)
