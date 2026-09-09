"""Persisted matching candidates for an urgency (no extra PII columns)."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Index, UniqueConstraint, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.enums import MatchMethod
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.donor import Donor
    from app.models.urgency import UrgencyRequest


class UrgencyMatch(TimestampMixin, Base):
    """Links an urgency to a matched donor without storing phone or GPS."""

    __tablename__ = "urgency_matches"
    __table_args__ = (
        UniqueConstraint(
            "urgency_request_id",
            "donor_id",
            name="uq_urgency_matches_urgency_donor",
        ),
        Index("ix_urgency_matches_urgency_request_id", "urgency_request_id"),
        Index("ix_urgency_matches_donor_id", "donor_id"),
        {"comment": "Matched donors for an urgency. No phone/GPS/blood group columns."},
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
    match_method: Mapped[MatchMethod] = mapped_column(
        Enum(
            MatchMethod,
            name="match_method",
            values_callable=lambda members: [member.value for member in members],
        ),
        nullable=False,
    )

    urgency_request: Mapped["UrgencyRequest"] = relationship(back_populates="matches")
    donor: Mapped["Donor"] = relationship(back_populates="urgency_matches")
