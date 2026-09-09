"""SQLAlchemy engine / session factory. Created lazily from DATABASE_URL."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings

_engine: Engine | None = None
_SessionLocal: sessionmaker[Session] | None = None


def get_engine() -> Engine:
    global _engine
    if _engine is None:
        url = get_settings().database_url
        if not url:
            raise RuntimeError(
                "DATABASE_URL is not set. Copy .env.example to .env and set it "
                "(see backend/README.md)."
            )
        _engine = create_engine(url, pool_pre_ping=True)
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(bind=get_engine(), autoflush=False, autocommit=False)
    return _SessionLocal


def get_db() -> Generator[Session, None, None]:
    """FastAPI session dependency. DATABASE_URL must be set for write routes."""
    from fastapi import HTTPException

    try:
        session = get_session_factory()()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    try:
        yield session
    finally:
        session.close()
