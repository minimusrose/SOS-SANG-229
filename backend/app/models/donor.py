"""Donor (User / Donneur) ORM model."""

import uuid
from typing import TYPE_CHECKING

from geoalchemy2 import Geography
from geoalchemy2.elements import WKBElement
from sqlalchemy import Boolean, Enum, Index, String, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.enums import BloodGroup
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.donation import DonationConfirmation

_SENSITIVE = "SENSITIVE — never log in cleartext."


class Donor(TimestampMixin, Base):
    """Registered blood donor.

    Sensitive columns: ``phone``, ``blood_group``, ``location`` (GPS).
    """

    __tablename__ = "donors"
    __table_args__ = (
        Index("ix_donors_blood_group", "blood_group"),
        Index("ix_donors_city", "city"),
        Index("ix_donors_location", "location", postgresql_using="gist"),
        {"comment": "Blood donors. phone, blood_group, location are SENSITIVE."},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    blood_group: Mapped[BloodGroup] = mapped_column(
        Enum(
            BloodGroup,
            name="blood_group",
            values_callable=lambda members: [member.value for member in members],
        ),
        nullable=False,
        comment=f"Blood group. {_SENSITIVE}",
    )
    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        unique=True,
        comment=f"E.164-style phone. {_SENSITIVE}",
    )
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    location: Mapped[WKBElement | None] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=False),
        nullable=True,
        comment=f"Optional GPS (WGS84 geography). {_SENSITIVE}",
    )
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    donation_confirmations: Mapped[list["DonationConfirmation"]] = relationship(
        back_populates="donor",
    )
