from datetime import UTC, datetime
from uuid import uuid4

from domain.entities.user_entity import User
from domain.errors.auth_errors import (
    MIN_PASSWORD_LENGTH,
    EmailAlreadyExistsError,
    WeakPasswordError,
)
from domain.interfaces.dtos.auth_dto import AuthResponseDTO, RegisterRequestDTO
from domain.interfaces.repos.user_repo import IUserRepository
from domain.interfaces.services.security_service import IPasswordHasher, ITokenService
from domain.mappers.project_mapper import to_user_dto


class RegisterUseCase:
    def __init__(
        self, user_repo: IUserRepository, hasher: IPasswordHasher, tokens: ITokenService
    ) -> None:
        self._user_repo = user_repo
        self._hasher = hasher
        self._tokens = tokens

    def execute(self, request: RegisterRequestDTO) -> AuthResponseDTO:
        email = request.email.strip().lower()
        if len(request.password) < MIN_PASSWORD_LENGTH:
            raise WeakPasswordError
        if self._user_repo.find_by_email(email) is not None:
            raise EmailAlreadyExistsError

        user = self._user_repo.create(
            User(
                id=str(uuid4()),
                name=request.name.strip() or email.split("@")[0],
                is_guest=False,
                created_at=datetime.now(UTC),
                email=email,
                password_hash=self._hasher.hash(request.password),
            )
        )
        return AuthResponseDTO(access_token=self._tokens.issue(user.id), user=to_user_dto(user))
