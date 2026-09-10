"""Pydantic schemas for accounts / auth. Never log password values."""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import SENSITIVE_NOTE

_PHONE = Field(min_length=8, max_length=20, description=SENSITIVE_NOTE, examples=["+22900000000"])


class RegisterRequest(BaseModel):
    phone: str = _PHONE
    password: str = Field(min_length=8, max_length=128, description=SENSITIVE_NOTE)
    display_name: str = Field(min_length=1, max_length=255, examples=["Awa K."])


class LoginRequest(BaseModel):
    phone: str = _PHONE
    password: str = Field(min_length=1, max_length=128, description=SENSITIVE_NOTE)


class UserPublic(BaseModel):
    """Account info returned to the owner. No password. Phone included (own)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    phone: str = Field(description=SENSITIVE_NOTE)
    display_name: str
    has_donor_profile: bool = False


class AuthResponse(BaseModel):
    token: str
    user: UserPublic
