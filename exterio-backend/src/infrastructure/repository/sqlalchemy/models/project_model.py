from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.repository.sqlalchemy.config.database import Base


class ProjectModel(Base):
    """Regions, scale and rate overrides are JSON documents on the project row.

    They are always read and written together with the project, so one row
    keeps every save atomic and avoids three extra joins per request.
    """

    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120))
    image: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    regions: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    scale: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    rate_overrides: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
