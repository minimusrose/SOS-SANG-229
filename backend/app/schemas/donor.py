"""Pydantic schemas for donors (User / Donneur)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.enums import BloodGroup
from app.schemas.common import SENSITIVE_NOTE, GeoPoint


class DonorCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=255, examples=["Donneur Demo"])
    blood_group: BloodGroup = Field(description=SENSITIVE_NOTE, examples=["O+"])
    phone: str = Field(
        min_length=8,
        max_length=20,
        description=SENSITIVE_NOTE,
        examples=["+22900000000"],
    )
    city: str = Field(min_length=1, max_length=120, examples=["Zone Demo"])
    location: GeoPoint | None = Field(default=None, description=SENSITIVE_NOTE)
    is_available: bool = True


class DonorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    display_name: str
    blood_group: BloodGroup = Field(description=SENSITIVE_NOTE)
    phone: str = Field(description=SENSITIVE_NOTE)
    city: str
    location: GeoPoint | None = Field(default=None, description=SENSITIVE_NOTE)
    is_available: bool
    created_at: datetime
    updated_at: datetime


class DonorPublic(BaseModel):
    """API create/read payload. Phone and GPS are omitted."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    display_name: str
    blood_group: BloodGroup = Field(description=SENSITIVE_NOTE)
    city: str
    is_available: bool
    created_at: datetime
    updated_at: datetime
