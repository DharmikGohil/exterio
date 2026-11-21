"""ORM model <-> domain entity mappers for designs and users."""

from domain.entities.design_entity import Design, RenderStatus
from domain.entities.user_entity import User
from infrastructure.repository.mappers.project_mapper import as_utc
from infrastructure.repository.sqlalchemy.models.design_model import DesignModel
from infrastructure.repository.sqlalchemy.models.user_model import UserModel


def design_to_entity(model: DesignModel) -> Design:
    return Design(
        id=model.id,
        project_id=model.project_id,
        name=model.name,
        created_at=as_utc(model.created_at),
        updated_at=as_utc(model.updated_at),
        assignments=dict(model.assignments or {}),
        preview_path=model.preview_path,
        render_path=model.render_path,
        render_status=RenderStatus(model.render_status),
        render_error=model.render_error,
    )


def apply_design(model: DesignModel, design: Design) -> DesignModel:
    model.id = design.id
    model.project_id = design.project_id
    model.name = design.name
    model.assignments = dict(design.assignments)
    model.preview_path = design.preview_path
    model.render_path = design.render_path
    model.render_status = design.render_status.value
    model.render_error = design.render_error
    model.created_at = design.created_at
    model.updated_at = design.updated_at
    return model


def user_to_entity(model: UserModel) -> User:
    return User(
        id=model.id,
        name=model.name,
        is_guest=model.is_guest,
        created_at=as_utc(model.created_at),
        email=model.email,
        password_hash=model.password_hash,
    )
