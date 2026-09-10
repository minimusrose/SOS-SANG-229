"""Persisted SMS notification outcomes (no phone or message body)."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.donor import Donor
    from app.models.urgency import UrgencyRequest


class SmsNotification(TimestampMixin, Base):
    """One SMS attempt per matched donor. Phone and body are not stored."""

    __tablename__ = "sms_notifications"
    __table_args__ = (
        UniqueConstraint(
            "urgency_request_id",
            "donor_id",
            name="uq_sms_notifications_urgency_donor",
        ),
        Index("ix_sms_notifications_urgency_request_id", "urgency_request_id"),
        Index("ix_sms_notifications_donor_id", "donor_id"),
        {
            "comment": (
                "SMS outcomes for an urgency. No phone, GPS, blood group, "
                "or message body columns."
            )
        },
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    urgency_request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("urgency_requests.id", ondelete="CASCADE"),
        nullable=False,
    )
    donor_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("donors.id", ondelete="RESTRICT"),
        nullable=False,
    )
    channel: Mapped[str] = mapped_column(String(32), nullable=False)
    mode: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False)

    urgency_request: Mapped["UrgencyRequest"] = relationship(
        back_populates="sms_notifications",
    )
    donor: Mapped["Donor"] = relationship(back_populates="sms_notifications")
