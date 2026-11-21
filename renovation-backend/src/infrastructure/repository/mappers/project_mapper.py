"""ORM model <-> domain entity mappers for projects."""

from datetime import UTC, datetime
from typing import Any

from domain.entities.project_entity import (
    IssueSeverity,
    Project,
    ProjectImage,
    QualityIssue,
    QualityMetrics,
    QualityReport,
    RateOverride,
)
from domain.entities.region_entity import Point, Region, RegionLabel, RegionSource
from domain.entities.scale_reference_entity import ScaleMethod, ScaleReference
from infrastructure.repository.sqlalchemy.models.project_model import ProjectModel


def as_utc(value: datetime) -> datetime:
    """SQLite drops the timezone; every timestamp in this system is UTC."""
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


def _point(value: list[float]) -> Point:
    return (float(value[0]), float(value[1]))


def region_to_json(region: Region) -> dict[str, Any]:
    return {
        "id": region.id,
        "label": region.label.value,
        "name": region.name,
        "polygon": [list(point) for point in region.polygon],
        "source": region.source.value,
        "surface_multiplier": region.surface_multiplier,
        "area_override_sqft": region.area_override_sqft,
        "length_override_ft": region.length_override_ft,
    }


def region_from_json(data: dict[str, Any]) -> Region:
    return Region(
        id=data["id"],
        label=RegionLabel(data["label"]),
        name=data["name"],
        polygon=tuple(_point(point) for point in data["polygon"]),
        source=RegionSource(data.get("source", RegionSource.USER)),
        surface_multiplier=float(data.get("surface_multiplier", 1.0)),
        area_override_sqft=data.get("area_override_sqft"),
        length_override_ft=data.get("length_override_ft"),
    )


def scale_to_json(scale: ScaleReference) -> dict[str, Any]:
    return {
        "method": scale.method.value,
        "facade_corners": [list(point) for point in scale.facade_corners],
        "reference_line": [list(point) for point in scale.reference_line]
        if scale.reference_line
        else None,
        "reference_length_ft": scale.reference_length_ft,
        "facade_width_ft": scale.facade_width_ft,
        "facade_height_ft": scale.facade_height_ft,
        "storeys": scale.storeys,
        "door_height_ft": scale.door_height_ft,
    }


def scale_from_json(data: dict[str, Any]) -> ScaleReference:
    tl, tr, br, bl = (_point(point) for point in data["facade_corners"])
    line = data.get("reference_line")
    return ScaleReference(
        method=ScaleMethod(data["method"]),
        facade_corners=(tl, tr, br, bl),
        reference_line=(_point(line[0]), _point(line[1])) if line else None,
        reference_length_ft=data.get("reference_length_ft"),
        facade_width_ft=data.get("facade_width_ft"),
        facade_height_ft=data.get("facade_height_ft"),
        storeys=int(data.get("storeys", 1)),
        door_height_ft=float(data.get("door_height_ft", 7.0)),
    )


def image_to_json(image: ProjectImage) -> dict[str, Any]:
    quality = image.quality
    return {
        "path": image.path,
        "width": image.width,
        "height": image.height,
        "quality": {
            "usable": quality.usable,
            "score": quality.score,
            "issues": [
                {"code": issue.code, "severity": issue.severity.value, "message": issue.message}
                for issue in quality.issues
            ],
            "guidance": list(quality.guidance),
            "metrics": {
                "width": quality.metrics.width,
                "height": quality.metrics.height,
                "blur_score": quality.metrics.blur_score,
                "brightness": quality.metrics.brightness,
            },
        },
    }


def image_from_json(data: dict[str, Any]) -> ProjectImage:
    quality = data["quality"]
    return ProjectImage(
        path=data["path"],
        width=int(data["width"]),
        height=int(data["height"]),
        quality=QualityReport(
            usable=bool(quality["usable"]),
            score=int(quality["score"]),
            issues=tuple(
                QualityIssue(issue["code"], IssueSeverity(issue["severity"]), issue["message"])
                for issue in quality["issues"]
            ),
            guidance=tuple(quality["guidance"]),
            metrics=QualityMetrics(**quality["metrics"]),
        ),
    )


def overrides_to_json(overrides: dict[str, RateOverride]) -> dict[str, Any]:
    return {
        material_id: {
            "material_rate": override.material_rate,
            "labour_rate": override.labour_rate,
            "wastage_pct": override.wastage_pct,
        }
        for material_id, override in overrides.items()
    }


def overrides_from_json(data: dict[str, Any]) -> dict[str, RateOverride]:
    return {material_id: RateOverride(**values) for material_id, values in data.items()}


def project_to_entity(model: ProjectModel) -> Project:
    return Project(
        id=model.id,
        user_id=model.user_id,
        name=model.name,
        created_at=as_utc(model.created_at),
        updated_at=as_utc(model.updated_at),
        image=image_from_json(model.image) if model.image else None,
        regions=tuple(region_from_json(region) for region in model.regions or []),
        scale=scale_from_json(model.scale) if model.scale else None,
        rate_overrides=overrides_from_json(model.rate_overrides or {}),
    )


def apply_project(model: ProjectModel, project: Project) -> ProjectModel:
    model.id = project.id
    model.user_id = project.user_id
    model.name = project.name
    model.image = image_to_json(project.image) if project.image else None
    model.regions = [region_to_json(region) for region in project.regions]
    model.scale = scale_to_json(project.scale) if project.scale else None
    model.rate_overrides = overrides_to_json(project.rate_overrides)
    model.created_at = project.created_at
    model.updated_at = project.updated_at
    return model
