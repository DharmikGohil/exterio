from domain.interfaces.dtos.auth_dto import DemoAccountDTO
from presentation.schemas.auth_schema import DemoAccountResponse


class GetDemoAccountController:
    """Publishes the reviewer sign-in, or null when the deployment has none."""

    def __init__(self, demo_account: DemoAccountDTO | None) -> None:
        self._demo_account = demo_account

    def handle(self) -> DemoAccountResponse | None:
        if self._demo_account is None:
            return None
        return DemoAccountResponse.model_validate(self._demo_account)
