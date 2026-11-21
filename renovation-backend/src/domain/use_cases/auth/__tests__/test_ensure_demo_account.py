from typing import Any, cast

import pytest

from domain.entities.project_entity import Project
from domain.entities.user_entity import User
from domain.errors.auth_errors import WeakPasswordError
from domain.interfaces.repos.project_repo import IProjectRepository
from domain.interfaces.repos.user_repo import IUserRepository
from domain.interfaces.services.security_service import IPasswordHasher
from domain.use_cases.auth.ensure_demo_account_usecase import EnsureDemoAccountUseCase


class PlainHasher(IPasswordHasher):
    def hash(self, password: str) -> str:
        return f"hashed:{password}"

    def verify(self, password: str, password_hash: str) -> bool:
        return password_hash == f"hashed:{password}"


class MemoryUsers(IUserRepository):
    def __init__(self) -> None:
        self.by_id: dict[str, User] = {}

    def find_by_id(self, user_id: str) -> User | None:
        return self.by_id.get(user_id)

    def find_by_email(self, email: str) -> User | None:
        return next((user for user in self.by_id.values() if user.email == email), None)

    def create(self, user: User) -> User:
        self.by_id[user.id] = user
        return user

    def update_password_hash(self, user_id: str, password_hash: str) -> None:
        user = self.by_id[user_id]
        self.by_id[user_id] = User(
            user.id, user.name, user.is_guest, user.created_at, user.email, password_hash
        )


class MemoryProjects(IProjectRepository):
    def __init__(self) -> None:
        self.owners: list[str] = []

    def find_by_id(self, project_id: str) -> Project | None:
        return None

    def find_all_by_user(self, user_id: str) -> list[Project]:
        return [cast(Project, object()) for owner in self.owners if owner == user_id]

    def create(self, project: Project) -> Project:
        return project

    def update(self, project: Project) -> Project:
        return project

    def delete(self, project_id: str) -> None:
        return None


class SampleCreator:
    def __init__(self, projects: MemoryProjects) -> None:
        self.projects = projects

    def execute(self, user_id: str) -> None:
        self.projects.owners.append(user_id)


@pytest.fixture
def parts():
    users, projects = MemoryUsers(), MemoryProjects()
    use_case = EnsureDemoAccountUseCase(
        users, projects, PlainHasher(), cast(Any, SampleCreator(projects))
    )
    return use_case, users, projects


def test_creates_the_account_with_one_sample_house_and_publishes_it(parts):
    use_case, users, projects = parts

    actual = use_case.execute(" Demo@Example.com ", "review-2026")

    user = users.find_by_email("demo@example.com")
    assert actual.email == "demo@example.com"
    assert actual.password == "review-2026"
    assert user is not None
    assert user.is_guest is False
    assert projects.owners == [user.id]


def test_running_again_adds_nothing(parts):
    use_case, users, projects = parts

    use_case.execute("demo@example.com", "review-2026")
    use_case.execute("demo@example.com", "review-2026")

    assert len(users.by_id) == 1
    assert len(projects.owners) == 1


def test_a_changed_published_password_replaces_the_old_one(parts):
    use_case, users, _ = parts
    use_case.execute("demo@example.com", "review-2026")

    use_case.execute("demo@example.com", "new-pass-99")

    user = users.find_by_email("demo@example.com")
    assert user is not None
    assert user.password_hash == "hashed:new-pass-99"


def test_a_short_password_is_refused(parts):
    use_case, _, _ = parts

    with pytest.raises(WeakPasswordError):
        use_case.execute("demo@example.com", "123")
