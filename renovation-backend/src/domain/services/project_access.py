"""Ownership checks shared by project and design use cases."""

from domain.entities.design_entity import Design
from domain.entities.project_entity import Project
from domain.errors.project_errors import DesignNotFoundError, ProjectNotFoundError
from domain.interfaces.repos.design_repo import IDesignRepository
from domain.interfaces.repos.project_repo import IProjectRepository


def get_owned_project(repo: IProjectRepository, project_id: str, user_id: str) -> Project:
    project = repo.find_by_id(project_id)
    if project is None or project.user_id != user_id:
        raise ProjectNotFoundError
    return project


def get_owned_design(
    design_repo: IDesignRepository, project_repo: IProjectRepository, design_id: str, user_id: str
) -> tuple[Design, Project]:
    design = design_repo.find_by_id(design_id)
    if design is None:
        raise DesignNotFoundError
    project = project_repo.find_by_id(design.project_id)
    if project is None or project.user_id != user_id:
        raise DesignNotFoundError
    return design, project
