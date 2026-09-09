"""Pydantic schemas for urgency / emergency requests (demandes d'urgence)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.enums import BloodGroup, UrgencyStatus
from app.schemas.common import SENSITIVE_NOTE


class UrgencyRequestCreate(BaseModel):
    public_ref: str = Field(min_length=1, max_length=40, examples=["REQ-DEMO-001"])
    blood_group_needed: BloodGroup = Field(description=SENSITIVE_NOTE, examples=["O+"])
    patient_display_name: str = Field(
        min_length=1,
        max_length=255,
        description=f"Demo-only display name. {SENSITIVE_NOTE}",
        examples=["Patient Demo"],
    )
    hospital_id: UUID = Field(
        description=(
            "FK to hospitals.id only (no free-text hospital name). "
            "API must reject the request if hospitals.is_recognized is false."
        ),
    )
    units_needed: int = Field(default=1, ge=1)
    zone_label: str | None = Field(default=None, max_length=255, examples=["Zone Demo"])


class UrgencyRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    public_ref: str
    blood_group_needed: BloodGroup = Field(description=SENSITIVE_NOTE)
    patient_display_name: str = Field(description=SENSITIVE_NOTE)
    hospital_id: UUID
    status: UrgencyStatus
    units_needed: int
    zone_label: str | None
    alerted_donors_count: int
    confirmed_donations_count: int
    created_at: datetime
    updated_at: datetime
