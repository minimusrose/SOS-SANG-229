"""Urgency / emergency request (Demande d'urgence) ORM model."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Index, Integer, String, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.enums import BloodGroup, UrgencyStatus
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.donation import DonationConfirmation
    from app.models.hospital import Hospital
    from app.models.match import UrgencyMatch
    from app.models.notification import SmsNotification
    from app.models.user import User

_SENSITIVE = "SENSITIVE — never log in cleartext."


class UrgencyRequest(TimestampMixin, Base):
    """Transfusion emergency (urgence) opened by a hospital.

    Sensitive columns: ``blood_group_needed``, ``patient_display_name``.
    """

    __tablename__ = "urgency_requests"
    __table_args__ = (
        CheckConstraint("units_needed >= 1", name="ck_urgency_units_needed"),
        CheckConstraint("alerted_donors_count >= 0", name="ck_urgency_alerted_count"),
        CheckConstraint(
            "confirmed_donations_count >= 0",
            name="ck_urgency_confirmed_count",
        ),
        Index("ix_urgency_requests_status", "status"),
        Index("ix_urgency_requests_blood_group_needed", "blood_group_needed"),
        Index("ix_urgency_requests_hospital_id", "hospital_id"),
        Index("ix_urgency_requests_requester_user_id", "requester_user_id"),
        {
            "comment": (
                "Emergency requests. blood_group_needed and "
                "patient_display_name are SENSITIVE."
            )
        },
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    public_ref: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    blood_group_needed: Mapped[BloodGroup] = mapped_column(
        Enum(
            BloodGroup,
            name="blood_group",
            values_callable=lambda members: [member.value for member in members],
        ),
        nullable=False,
        comment=f"Requested blood group. {_SENSITIVE}",
    )
    patient_display_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment=f"Demo-only display name, not a real patient. {_SENSITIVE}",
    )
    hospital_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("hospitals.id", ondelete="RESTRICT"),
        nullable=False,
        comment=(
            "FK only — no free-text hospital name. "
            "Must reference hospitals.is_recognized = true (enforced in DB + API)."
        ),
    )
    requester_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="Account that opened this request. Nullable for legacy/seed rows.",
    )
    status: Mapped[UrgencyStatus] = mapped_column(
        Enum(
            UrgencyStatus,
            name="urgency_status",
            values_callable=lambda members: [member.value for member in members],
        ),
        nullable=False,
        default=UrgencyStatus.OPEN,
        server_default=UrgencyStatus.OPEN.value,
    )
    units_needed: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    zone_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    alerted_donors_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    confirmed_donations_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    hospital: Mapped["Hospital"] = relationship(back_populates="urgency_requests")
    requester: Mapped["User | None"] = relationship(back_populates="requests")
    donation_confirmations: Mapped[list["DonationConfirmation"]] = relationship(
        back_populates="urgency_request",
    )
    matches: Mapped[list["UrgencyMatch"]] = relationship(
        back_populates="urgency_request",
    )
    sms_notifications: Mapped[list["SmsNotification"]] = relationship(
        back_populates="urgency_request",
    )
