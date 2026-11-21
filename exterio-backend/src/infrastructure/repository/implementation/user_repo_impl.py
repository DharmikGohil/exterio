from sqlalchemy import select

from domain.entities.user_entity import User
from domain.interfaces.repos.user_repo import IUserRepository
from infrastructure.repository.mappers.design_mapper import user_to_entity
from infrastructure.repository.sqlalchemy.config.database import SessionFactory
from infrastructure.repository.sqlalchemy.models.user_model import UserModel


class UserRepository(IUserRepository):
    def __init__(self, session_factory: SessionFactory) -> None:
        self._session_factory = session_factory

    def find_by_id(self, user_id: str) -> User | None:
        with self._session_factory() as session:
            model = session.get(UserModel, user_id)
            return user_to_entity(model) if model else None

    def find_by_email(self, email: str) -> User | None:
        with self._session_factory() as session:
            model = session.scalar(select(UserModel).where(UserModel.email == email))
            return user_to_entity(model) if model else None

    def create(self, user: User) -> User:
        with self._session_factory.begin() as session:
            session.add(
                UserModel(
                    id=user.id,
                    email=user.email,
                    name=user.name,
                    password_hash=user.password_hash,
                    is_guest=user.is_guest,
                    created_at=user.created_at,
                )
            )
        return user

    def update_password_hash(self, user_id: str, password_hash: str) -> None:
        with self._session_factory.begin() as session:
            model = session.get(UserModel, user_id)
            if model is not None:
                model.password_hash = password_hash
