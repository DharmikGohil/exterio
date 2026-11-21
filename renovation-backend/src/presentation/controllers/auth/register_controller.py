from domain.interfaces.dtos.auth_dto import RegisterRequestDTO
from domain.use_cases.auth.register_usecase import RegisterUseCase
from presentation.schemas.auth_schema import AuthResponse, RegisterRequest


class RegisterController:
    def __init__(self, register: RegisterUseCase) -> None:
        self._register = register

    def handle(self, body: RegisterRequest) -> AuthResponse:
        result = self._register.execute(
            RegisterRequestDTO(email=body.email, password=body.password, name=body.name)
        )
        return AuthResponse.model_validate(result)
