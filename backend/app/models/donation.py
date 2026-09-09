"""Donation confirmation (Confirmation de don) ORM model."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, UniqueConstraint, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.enums import DonationStatus
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.donor import Donor
    from app.models.urgency import UrgencyRequest


class DonationConfirmation(TimestampMixin, Base):
    """Links a donor to an urgency when they confirm they will donate."""

    __tablename__ = "donation_confirmations"
    __table_args__ = (
        UniqueConstraint(
            "donor_id",
            "urgency_request_id",
            name="uq_donation_confirmations_donor_urgency",
        ),
        Index("ix_donation_confirmations_donor_id", "donor_id"),
        Index("ix_donation_confirmations_urgency_request_id", "urgency_request_id"),
        {"comment": "Donor confirmations against an urgency request."},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    donor_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("donors.id", ondelete="RESTRICT"),
        nullable=False,
    )
    urgency_request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("urgency_requests.id", ondelete="CASCADE"),
        nullable=False,
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    status: Mapped[DonationStatus] = mapped_column(
        Enum(
            DonationStatus,
            name="donation_status",
            values_callable=lambda members: [member.value for member in members],
        ),
        nullable=False,
        default=DonationStatus.PENDING,
        server_default=DonationStatus.PENDING.value,
    )

    donor: Mapped["Donor"] = relationship(back_populates="donation_confirmations")
    urgency_request: Mapped["UrgencyRequest"] = relationship(
        back_populates="donation_confirmations",
    )
