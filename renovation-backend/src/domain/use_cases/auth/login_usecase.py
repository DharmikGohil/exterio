from domain.errors.auth_errors import InvalidCredentialsError
from domain.interfaces.dtos.auth_dto import AuthResponseDTO, LoginRequestDTO
from domain.interfaces.repos.user_repo import IUserRepository
from domain.interfaces.services.security_service import IPasswordHasher, ITokenService
from domain.mappers.project_mapper import to_user_dto


class LoginUseCase:
    def __init__(
        self, user_repo: IUserRepository, hasher: IPasswordHasher, tokens: ITokenService
    ) -> None:
        self._user_repo = user_repo
        self._hasher = hasher
        self._tokens = tokens

    def execute(self, request: LoginRequestDTO) -> AuthResponseDTO:
        user = self._user_repo.find_by_email(request.email.strip().lower())
        if user is None or user.password_hash is None:
            raise InvalidCredentialsError
        if not self._hasher.verify(request.password, user.password_hash):
            raise InvalidCredentialsError
        return AuthResponseDTO(access_token=self._tokens.issue(user.id), user=to_user_dto(user))
