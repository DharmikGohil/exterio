"""Entity -> DTO mappers. File paths become URLs here, never in the entities."""

from collections.abc import Callable

from domain.entities.design_entity import Design
from domain.entities.material_entity import Material
from domain.entities.project_entity import Project
from domain.entities.user_entity import User
from domain.interfaces.dtos.auth_dto import UserDTO
from domain.interfaces.dtos.project_dto import (
    DesignDTO,
    MaterialDTO,
    ProjectDTO,
    ProjectImageDTO,
    ProjectSummaryDTO,
)

UrlFor = Callable[[str], str]


def swatch_path(material_id: str) -> str:
    return f"catalog/swatches/{material_id}.png"


def thumbnail_path(project_id: str) -> str:
    return f"projects/{project_id}/thumbnail.jpg"


def to_user_dto(user: User) -> UserDTO:
    return UserDTO(id=user.id, email=user.email, name=user.name, is_guest=user.is_guest)


def to_design_dto(design: Design, url_for: UrlFor) -> DesignDTO:
    return DesignDTO(
        id=design.id,
        project_id=design.project_id,
        name=design.name,
        assignments=dict(design.assignments),
        preview_url=url_for(design.preview_path) if design.preview_path else None,
        render_url=url_for(design.render_path) if design.render_path else None,
        render_status=design.render_status,
        render_error=design.render_error,
        updated_at=design.updated_at,
    )


def to_project_dto(project: Project, designs: list[Design], url_for: UrlFor) -> ProjectDTO:
    image = None
    if project.image is not None:
        image = ProjectImageDTO(
            url=url_for(project.image.path),
            width=project.image.width,
            height=project.image.height,
            quality=project.image.quality,
        )
    return ProjectDTO(
        id=project.id,
        name=project.name,
        image=image,
        regions=project.regions,
        scale=project.scale,
        designs=tuple(to_design_dto(design, url_for) for design in designs),
        rate_overrides=dict(project.rate_overrides),
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


def to_project_summary_dto(
    project: Project, design_count: int, url_for: UrlFor
) -> ProjectSummaryDTO:
    thumbnail = url_for(thumbnail_path(project.id)) if project.image is not None else None
    if thumbnail is not None:
        # The thumbnail keeps its path when the photo is replaced, so bust caches explicitly.
        thumbnail = f"{thumbnail}?v={int(project.updated_at.timestamp())}"
    return ProjectSummaryDTO(
        id=project.id,
        name=project.name,
        thumbnail_url=thumbnail,
        design_count=design_count,
        updated_at=project.updated_at,
    )


def to_material_dto(material: Material, url_for: UrlFor) -> MaterialDTO:
    return MaterialDTO(
        id=material.id,
        category=material.category,
        name=material.name,
        description=material.description,
        unit=material.unit,
        color_hex=material.color_hex,
        swatch_url=url_for(swatch_path(material.id)),
        material_rate=material.material_rate,
        labour_rate=material.labour_rate,
        wastage_pct=material.wastage_pct,
        applies_to=material.applies_to,
        durability=material.durability,
        maintenance=material.maintenance,
    )
