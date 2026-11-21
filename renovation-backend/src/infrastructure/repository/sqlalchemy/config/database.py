"""Database engine and session factory."""

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

SQLITE_PREFIX = "sqlite"
SessionFactory = sessionmaker[Session]


class Base(DeclarativeBase):
    pass


def normalise_database_url(url: str) -> str:
    """Hosted Postgres providers hand out postgres:// URLs; SQLAlchemy needs a driver name."""
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix) :]
    return url


def create_database_engine(url: str) -> Engine:
    url = normalise_database_url(url)
    if url.startswith(SQLITE_PREFIX):
        options: dict[str, object] = {"connect_args": {"check_same_thread": False}}
        if ":memory:" in url:
            options["poolclass"] = StaticPool
        return create_engine(url, **options)
    return create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=10)


def create_session_factory(engine: Engine) -> SessionFactory:
    return sessionmaker(bind=engine, expire_on_commit=False)


def create_schema(engine: Engine) -> None:
    # Imported for its side effect: registering the models on Base.metadata.
    from infrastructure.repository.sqlalchemy import models  # noqa: F401, PLC0415

    Base.metadata.create_all(engine)
