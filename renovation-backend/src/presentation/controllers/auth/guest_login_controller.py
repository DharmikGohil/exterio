from domain.use_cases.auth.guest_login_usecase import GuestLoginUseCase
from presentation.schemas.auth_schema import AuthResponse


class GuestLoginController:
    def __init__(self, guest_login: GuestLoginUseCase) -> None:
        self._guest_login = guest_login

    def handle(self) -> AuthResponse:
        return AuthResponse.model_validate(self._guest_login.execute())
