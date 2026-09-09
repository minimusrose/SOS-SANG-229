"""Application settings. Secrets come from the environment only."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[1]
_REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Runtime config. DATABASE_URL must not be hardcoded in source."""

    model_config = SettingsConfigDict(
        env_file=(_BACKEND_DIR / ".env", _REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = ""
    # GPS matching radius (meters). City fallback is used when GPS is missing.
    match_radius_meters: int = 15_000


@lru_cache
def get_settings() -> Settings:
    return Settings()
