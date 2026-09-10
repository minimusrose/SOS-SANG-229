"""Application settings. Secrets come from the environment only."""

from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[1]
_REPO_ROOT = Path(__file__).resolve().parents[2]

SMS_MODE_SIMULATE = "simulate"
SMS_MODE_LIVE = "live"

# Always allowed for local Vite (`npm run dev`). Production origins come from
# FRONTEND_ORIGIN (comma-separated), e.g. the Vercel URL.
LOCAL_FRONTEND_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


def parse_frontend_origins(raw: str) -> list[str]:
    """Split FRONTEND_ORIGIN on commas; strip whitespace and trailing slashes."""
    origins: list[str] = []
    seen: set[str] = set()
    for part in (raw or "").split(","):
        origin = part.strip().rstrip("/")
        if origin and origin not in seen:
            seen.add(origin)
            origins.append(origin)
    return origins


def normalize_database_url(raw: str) -> str:
    """Accept Railway ``postgres://`` URLs; SQLAlchemy wants ``postgresql://``."""
    url = (raw or "").strip()
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://") :]
    return url


class Settings(BaseSettings):
    """Runtime config. DATABASE_URL and Twilio secrets must not be hardcoded."""

    model_config = SettingsConfigDict(
        env_file=(_BACKEND_DIR / ".env", _REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    # Comma-separated browser origins for CORS (Vercel + extras). Localhost
    # Vite origins are always included — see cors_allow_origins().
    frontend_origin: str = "http://localhost:5173"

    database_url: str = ""
    # GPS matching radius (meters). City fallback is used when GPS is missing.
    match_radius_meters: int = 15_000

    # SMS: default simulate — no Twilio network. Live stays off unless
    # SMS_MODE=live AND all TWILIO_* credentials are present.
    sms_mode: str = SMS_MODE_SIMULATE
    twilio_account_sid: str = ""
    twilio_auth_token: SecretStr = SecretStr("")
    twilio_from_number: str = ""

    @field_validator("database_url", mode="before")
    @classmethod
    def coerce_database_url(cls, value: object) -> str:
        if value is None:
            return ""
        return normalize_database_url(str(value))

    def cors_allow_origins(self) -> list[str]:
        """Local Vite origins plus FRONTEND_ORIGIN (production Vercel URL)."""
        extras = parse_frontend_origins(self.frontend_origin)
        result: list[str] = []
        seen: set[str] = set()
        for origin in (*LOCAL_FRONTEND_ORIGINS, *extras):
            if origin not in seen:
                seen.add(origin)
                result.append(origin)
        return result

    @field_validator("sms_mode", mode="before")
    @classmethod
    def normalize_sms_mode(cls, value: object) -> str:
        if value is None or str(value).strip() == "":
            return SMS_MODE_SIMULATE
        normalized = str(value).strip().lower()
        if normalized not in {SMS_MODE_SIMULATE, SMS_MODE_LIVE}:
            return SMS_MODE_SIMULATE
        return normalized

    def twilio_credentials_present(self) -> bool:
        sid = (self.twilio_account_sid or "").strip()
        token = self.twilio_auth_token.get_secret_value().strip()
        sender = (self.twilio_from_number or "").strip()
        return bool(sid and token and sender)

    def sms_live_enabled(self) -> bool:
        """True only when live is explicitly requested and credentials exist."""
        return self.sms_mode == SMS_MODE_LIVE and self.twilio_credentials_present()

    def effective_sms_mode(self) -> str:
        return SMS_MODE_LIVE if self.sms_live_enabled() else SMS_MODE_SIMULATE


@lru_cache
def get_settings() -> Settings:
    return Settings()
