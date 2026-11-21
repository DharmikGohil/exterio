from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.repository.sqlalchemy.config.database import Base


class DesignModel(Base):
    __tablename__ = "designs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120))
    assignments: Mapped[dict[str, str]] = mapped_column(JSON, default=dict)
    preview_path: Mapped[str | None] = mapped_column(String(300), nullable=True)
    render_path: Mapped[str | None] = mapped_column(String(300), nullable=True)
    render_status: Mapped[str] = mapped_column(String(20), default="none")
    render_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class RenderEventModel(Base):
    """One row per photoreal render request, used for the per-user daily cap."""

    __tablename__ = "render_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    design_id: Mapped[str] = mapped_column(String(36))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
