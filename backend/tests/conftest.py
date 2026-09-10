"""Pytest fixtures. SQLite is used so matching + endpoints run without secrets."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from geoalchemy2 import Geography
from sqlalchemy import create_engine, event
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import get_settings
from app.db import get_db
from app.main import app
from app.models import Base

_POSTGRES_ONLY_DEFAULTS = ("gen_random_uuid()",)
_SQLITE_GEO_FUNCS = (
    "ST_GeogFromText",
    "ST_GeogFromEWKT",
    "ST_GeomFromEWKT",
    "ST_GeomFromText",
    "ST_AsBinary",
    "AsBinary",
    "ST_AsEWKB",
    "ST_AsText",
)


@compiles(Geography, "sqlite")
def _compile_geography_sqlite(type_, compiler, **kw):  # noqa: ARG001
    return "TEXT"


def _strip_postgres_only_defaults() -> None:
    """Drop Postgres-only DDL defaults so SQLite ``create_all`` can run.

    Production still uses ``gen_random_uuid()`` via Alembic. Tests set PKs
    explicitly (or rely on application ``uuid4()``).
    """
    for table in Base.metadata.tables.values():
        for column in table.columns:
            default = column.server_default
            if default is None:
                continue
            arg = getattr(default, "arg", None)
            if arg is not None and str(arg) in _POSTGRES_ONLY_DEFAULTS:
                column.server_default = None


_strip_postgres_only_defaults()


@pytest.fixture(autouse=True)
def _sms_simulate_defaults(monkeypatch: pytest.MonkeyPatch):
    """Keep tests off the live Twilio path even if a local .env has leftovers."""
    monkeypatch.setenv("SMS_MODE", "simulate")
    monkeypatch.setenv("TWILIO_ACCOUNT_SID", "")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "")
    monkeypatch.setenv("TWILIO_FROM_NUMBER", "")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def db_session() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _configure_sqlite(dbapi_connection, _connection_record):  # noqa: ANN001
        dbapi_connection.execute("PRAGMA foreign_keys=ON")
        # GeoAlchemy2 still emits PostGIS constructors; store/return WKT text.
        for name in _SQLITE_GEO_FUNCS:
            dbapi_connection.create_function(name, 1, lambda value: value)

    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = factory()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture
def api_client() -> TestClient:
    """HTTP client without a database (health / OpenAPI)."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def client(db_session: Session) -> TestClient:
    def _override_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def make_account(client: TestClient):
    """Register an account via the API and return its bearer headers + ids."""
    counter = {"n": 0}

    def _make(
        *,
        phone: str | None = None,
        password: str = "motdepasse",
        name: str = "Compte Demo",
    ) -> dict:
        if phone is None:
            counter["n"] += 1
            phone = f"+2299000010{counter['n']:02d}"
        resp = client.post(
            "/auth/register",
            json={"phone": phone, "password": password, "display_name": name},
        )
        assert resp.status_code == 201, resp.text
        body = resp.json()
        return {
            "headers": {"Authorization": f"Bearer {body['token']}"},
            "token": body["token"],
            "user_id": body["user"]["id"],
            "phone": phone,
            "password": password,
        }

    return _make


@pytest.fixture
def account(make_account) -> dict:
    return make_account(phone="+22900001000", name="Compte Principal")
