"""Pydantic schemas for donation confirmations."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.enums import DonationStatus


class DonationConfirmationCreate(BaseModel):
    donor_id: UUID
    urgency_request_id: UUID


class DonationConfirmationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    donor_id: UUID
    urgency_request_id: UUID
    confirmed_at: datetime | None
    status: DonationStatus
    created_at: datetime
    updated_at: datetime
