"""Design entity: a named choice of material for each region of a project."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum


class RenderStatus(StrEnum):
    NONE = "none"
    PENDING = "pending"
    DONE = "done"
    FAILED = "failed"


@dataclass(frozen=True)
class Design:
    id: str
    project_id: str
    name: str
    created_at: datetime
    updated_at: datetime
    assignments: dict[str, str] = field(default_factory=dict)
    preview_path: str | None = None
    render_path: str | None = None
    render_status: RenderStatus = RenderStatus.NONE
    render_error: str | None = None
