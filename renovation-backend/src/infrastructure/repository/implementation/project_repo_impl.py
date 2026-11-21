from sqlalchemy import select

from domain.entities.project_entity import Project
from domain.errors.project_errors import ProjectNotFoundError
from domain.interfaces.repos.project_repo import IProjectRepository
from infrastructure.repository.mappers.project_mapper import apply_project, project_to_entity
from infrastructure.repository.sqlalchemy.config.database import SessionFactory
from infrastructure.repository.sqlalchemy.models.project_model import ProjectModel


class ProjectRepository(IProjectRepository):
    def __init__(self, session_factory: SessionFactory) -> None:
        self._session_factory = session_factory

    def find_by_id(self, project_id: str) -> Project | None:
        with self._session_factory() as session:
            model = session.get(ProjectModel, project_id)
            return project_to_entity(model) if model else None

    def find_all_by_user(self, user_id: str) -> list[Project]:
        query = (
            select(ProjectModel)
            .where(ProjectModel.user_id == user_id)
            .order_by(ProjectModel.updated_at.desc())
        )
        with self._session_factory() as session:
            return [project_to_entity(model) for model in session.scalars(query)]

    def create(self, project: Project) -> Project:
        with self._session_factory.begin() as session:
            session.add(apply_project(ProjectModel(), project))
        return project

    def update(self, project: Project) -> Project:
        with self._session_factory.begin() as session:
            model = session.get(ProjectModel, project.id)
            if model is None:
                raise ProjectNotFoundError
            apply_project(model, project)
        return project

    def delete(self, project_id: str) -> None:
        with self._session_factory.begin() as session:
            model = session.get(ProjectModel, project_id)
            if model is not None:
                session.delete(model)
