"""Settings helpers — no secrets, fictional origins only."""

from fastapi.testclient import TestClient

from app.config import Settings, normalize_database_url, parse_frontend_origins
from app.main import app


def test_parse_frontend_origins_comma_separated_and_trailing_slash() -> None:
    origins = parse_frontend_origins(
        "https://demo.vercel.app, https://preview.vercel.app/"
    )
    assert origins == [
        "https://demo.vercel.app",
        "https://preview.vercel.app",
    ]


def test_parse_frontend_origins_skips_empty() -> None:
    assert parse_frontend_origins("  , ,http://localhost:5173, ") == [
        "http://localhost:5173"
    ]


def test_cors_always_includes_local_vite_origins() -> None:
    settings = Settings(frontend_origin="")
    origins = settings.cors_allow_origins()
    assert "http://localhost:5173" in origins
    assert "http://127.0.0.1:5173" in origins


def test_cors_adds_production_frontend_origin() -> None:
    settings = Settings(frontend_origin="https://sos-sang-demo.vercel.app")
    origins = settings.cors_allow_origins()
    assert "https://sos-sang-demo.vercel.app" in origins
    assert "http://localhost:5173" in origins


def test_cors_comma_separated_frontend_origin() -> None:
    settings = Settings(
        frontend_origin="https://app.vercel.app,https://app-git-main.vercel.app/"
    )
    origins = settings.cors_allow_origins()
    assert "https://app.vercel.app" in origins
    assert "https://app-git-main.vercel.app" in origins


def test_normalize_railway_postgres_scheme() -> None:
    assert (
        normalize_database_url("postgres://user:pass@host:5432/db")
        == "postgresql://user:pass@host:5432/db"
    )
    assert normalize_database_url("postgresql://user:pass@host:5432/db") == (
        "postgresql://user:pass@host:5432/db"
    )
    assert Settings(database_url="postgres://u:p@h:5432/d").database_url == (
        "postgresql://u:p@h:5432/d"
    )


def test_cors_preflight_allows_localhost(api_client: TestClient) -> None:
    response = api_client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin") == (
        "http://localhost:5173"
    )


def test_cors_preflight_rejects_unknown_origin() -> None:
    with TestClient(app) as client:
        response = client.options(
            "/health",
            headers={
                "Origin": "https://unknown.example",
                "Access-Control-Request-Method": "GET",
            },
        )
    assert response.headers.get("access-control-allow-origin") != (
        "https://unknown.example"
    )
