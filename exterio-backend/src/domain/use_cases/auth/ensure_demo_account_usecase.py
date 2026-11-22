from datetime import UTC, datetime
from uuid import uuid4

from domain.entities.user_entity import User
from domain.errors.auth_errors import MIN_PASSWORD_LENGTH, WeakPasswordError
from domain.interfaces.dtos.auth_dto import DemoAccountDTO
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.repos.user_repo import IUserRepository
from domain.interfaces.services.security_service import IPasswordHasher
from domain.use_cases.project.create_sample_project_usecase import CreateSampleProjectUseCase

DEMO_ACCOUNT_NAME = "Demo reviewer"


class EnsureDemoAccountUseCase:
    """Makes sure the published demo account exists, signs in with the published password and
    has a finished sample house to open. Safe to run on every start."""

    def __init__(
        self,
        user_repo: IUserRepository,
        project_repo: IProjectRepository,
        hasher: IPasswordHasher,
        create_sample_project: CreateSampleProjectUseCase,
    ) -> None:
        self._user_repo = user_repo
        self._project_repo = project_repo
        self._hasher = hasher
        self._create_sample_project = create_sample_project

    def execute(self, email: str, password: str) -> DemoAccountDTO:
        email = email.strip().lower()
        if len(password) < MIN_PASSWORD_LENGTH:
            raise WeakPasswordError

        user = self._user_repo.find_by_email(email)
        if user is None:
            user = self._user_repo.create(
                User(
                    id=str(uuid4()),
                    name=DEMO_ACCOUNT_NAME,
                    is_guest=False,
                    created_at=datetime.now(UTC),
                    email=email,
                    password_hash=self._hasher.hash(password),
                )
            )
        elif user.password_hash is None or not self._hasher.verify(password, user.password_hash):
            # The published password changed since the account was made: follow it.
            self._user_repo.update_password_hash(user.id, self._hasher.hash(password))

        if not self._project_repo.find_all_by_user(user.id):
            self._create_sample_project.execute_all(user.id)
        return DemoAccountDTO(email=email, password=password)
