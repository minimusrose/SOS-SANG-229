"""Pydantic schemas for hospitals (établissements)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import SENSITIVE_NOTE, GeoPoint


class HospitalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255, examples=["Hopital Demo"])
    city: str = Field(min_length=1, max_length=120, examples=["Zone Demo"])
    location: GeoPoint | None = Field(default=None, description=SENSITIVE_NOTE)
    contact_name: str | None = Field(default=None, max_length=255, examples=["Contact Demo"])
    contact_phone: str | None = Field(
        default=None,
        max_length=20,
        description=SENSITIVE_NOTE,
        examples=["+22900000099"],
    )
    is_recognized: bool = Field(
        default=False,
        description=(
            "State-recognized facility. Default false. "
            "Urgency API must reject hospital_id when this is false."
        ),
    )


class HospitalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    city: str
    location: GeoPoint | None = Field(default=None, description=SENSITIVE_NOTE)
    contact_name: str | None
    contact_phone: str | None = Field(default=None, description=SENSITIVE_NOTE)
    is_recognized: bool
    created_at: datetime
    updated_at: datetime


class HospitalPublic(BaseModel):
    """Recognized-hospital select payload. No phone or GPS."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    city: str
    is_recognized: bool
