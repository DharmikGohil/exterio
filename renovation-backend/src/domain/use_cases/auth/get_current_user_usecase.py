from domain.errors.auth_errors import UnauthorizedError
from domain.interfaces.dtos.auth_dto import UserDTO
from domain.interfaces.repos.user_repo import IUserRepository
from domain.interfaces.services.security_service import ITokenService
from domain.mappers.project_mapper import to_user_dto


class GetCurrentUserUseCase:
    """Resolves a bearer token to its user. Used by the auth middleware."""

    def __init__(self, user_repo: IUserRepository, tokens: ITokenService) -> None:
        self._user_repo = user_repo
        self._tokens = tokens

    def execute(self, token: str | None) -> UserDTO:
        user_id = self._tokens.verify(token) if token else None
        user = self._user_repo.find_by_id(user_id) if user_id else None
        if user is None:
            raise UnauthorizedError
        return to_user_dto(user)
