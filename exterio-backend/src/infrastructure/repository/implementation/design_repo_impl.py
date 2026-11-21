from datetime import datetime

from sqlalchemy import delete, func, select

from domain.entities.design_entity import Design
from domain.errors.project_errors import DesignNotFoundError
from domain.interfaces.repos.design_repo import IDesignRepository
from infrastructure.repository.mappers.design_mapper import apply_design, design_to_entity
from infrastructure.repository.sqlalchemy.config.database import SessionFactory
from infrastructure.repository.sqlalchemy.models.design_model import DesignModel, RenderEventModel


class DesignRepository(IDesignRepository):
    def __init__(self, session_factory: SessionFactory) -> None:
        self._session_factory = session_factory

    def find_by_id(self, design_id: str) -> Design | None:
        with self._session_factory() as session:
            model = session.get(DesignModel, design_id)
            return design_to_entity(model) if model else None

    def find_all_by_project(self, project_id: str) -> list[Design]:
        query = (
            select(DesignModel)
            .where(DesignModel.project_id == project_id)
            .order_by(DesignModel.created_at)
        )
        with self._session_factory() as session:
            return [design_to_entity(model) for model in session.scalars(query)]

    def create(self, design: Design) -> Design:
        with self._session_factory.begin() as session:
            session.add(apply_design(DesignModel(), design))
        return design

    def update(self, design: Design) -> Design:
        with self._session_factory.begin() as session:
            model = session.get(DesignModel, design.id)
            if model is None:
                raise DesignNotFoundError
            apply_design(model, design)
        return design

    def delete(self, design_id: str) -> None:
        with self._session_factory.begin() as session:
            session.execute(delete(DesignModel).where(DesignModel.id == design_id))

    def delete_by_project(self, project_id: str) -> None:
        with self._session_factory.begin() as session:
            session.execute(delete(DesignModel).where(DesignModel.project_id == project_id))

    def count_renders_since(self, user_id: str, since: datetime) -> int:
        query = select(func.count(RenderEventModel.id)).where(
            RenderEventModel.user_id == user_id, RenderEventModel.created_at >= since
        )
        with self._session_factory() as session:
            return int(session.scalar(query) or 0)

    def record_render(self, user_id: str, design_id: str, at: datetime) -> None:
        with self._session_factory.begin() as session:
            session.add(RenderEventModel(user_id=user_id, design_id=design_id, created_at=at))
