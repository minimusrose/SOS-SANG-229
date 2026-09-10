"""Pydantic schemas for urgency / emergency requests (demandes d'urgence)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.enums import BloodGroup, MatchMethod, UrgencyStatus
from app.schemas.common import SENSITIVE_NOTE


class UrgencyRequestCreate(BaseModel):
    public_ref: str | None = Field(
        default=None,
        min_length=1,
        max_length=40,
        examples=["REQ-DEMO-001"],
        description="Optional. Generated as REQ-XXXXXXXX when omitted.",
    )
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


class MatchedDonorPublic(BaseModel):
    """Internal shape for a matched donor. Never returned to the requester."""

    donor_id: UUID
    display_name: str
    city: str
    match_method: MatchMethod


class MatchingSummary(BaseModel):
    """Aggregate only — the requester sees a count, never donor identities."""

    radius_meters: int = Field(
        description="GPS radius in meters. Default 15000 (15 km). City fallback if no GPS.",
    )
    match_count: int


class NotificationSummary(BaseModel):
    """Aggregated SMS outcomes after matching. No phone numbers."""

    channel: str = Field(
        description="sms_simulate in default/dev. sms only if live is enabled.",
        examples=["sms_simulate"],
    )
    mode: str = Field(description="Effective SMS_MODE (simulate unless live+creds).")
    implemented: bool = Field(
        description="True for the simulate layer. Live Twilio send is not implemented.",
    )
    sent: bool = Field(description="True only if a real SMS was accepted by Twilio.")
    simulated_count: int = 0
    attempted_count: int = 0
    failed_count: int = 0
    live_enabled: bool = False


# Older name kept so imports do not break mid-refactor.
NotificationStub = NotificationSummary


class UrgencyCreateResponse(UrgencyRequestRead):
    hospital_name: str
    hospital_city: str
    matching: MatchingSummary
    notification: NotificationSummary


class UrgencySummary(BaseModel):
    """List row for requesters. No phone, GPS, or blood group."""

    id: UUID
    public_ref: str
    status: UrgencyStatus
    hospital_name: str
    hospital_city: str
    units_needed: int
    zone_label: str | None
    alerted_donors_count: int
    confirmed_donations_count: int
    created_at: datetime


class MyRequestSummary(UrgencySummary):
    """A request opened by the current account (own data → group is shown)."""

    blood_group_needed: BloodGroup = Field(description=SENSITIVE_NOTE)


class MatchedRequestSummary(UrgencySummary):
    """A request the current account was matched to, as a donor."""

    blood_group_needed: BloodGroup = Field(description=SENSITIVE_NOTE)
    i_confirmed: bool = False


class UrgencyTrackingRead(BaseModel):
    """Requester tracking. Phone and GPS are omitted."""

    id: UUID
    public_ref: str
    status: UrgencyStatus
    blood_group_needed: BloodGroup = Field(description=SENSITIVE_NOTE)
    patient_display_name: str = Field(description=SENSITIVE_NOTE)
    hospital_id: UUID
    hospital_name: str
    hospital_city: str
    units_needed: int
    zone_label: str | None
    alerted_donors_count: int
    confirmed_donations_count: int
    created_at: datetime
    updated_at: datetime
