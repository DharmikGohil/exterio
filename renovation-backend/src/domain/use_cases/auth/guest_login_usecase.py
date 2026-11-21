from datetime import UTC, datetime
from uuid import uuid4

from domain.entities.user_entity import User
from domain.interfaces.dtos.auth_dto import AuthResponseDTO
from domain.interfaces.repos.user_repo import IUserRepository
from domain.interfaces.services.security_service import ITokenService
from domain.mappers.project_mapper import to_user_dto


class GuestLoginUseCase:
    """Creates an anonymous account so nobody is blocked by a sign-up form."""

    def __init__(self, user_repo: IUserRepository, tokens: ITokenService) -> None:
        self._user_repo = user_repo
        self._tokens = tokens

    def execute(self) -> AuthResponseDTO:
        user = self._user_repo.create(
            User(id=str(uuid4()), name="Guest", is_guest=True, created_at=datetime.now(UTC))
        )
        return AuthResponseDTO(access_token=self._tokens.issue(user.id), user=to_user_dto(user))
