"""Hospital (Établissement) ORM model."""

import uuid
from typing import TYPE_CHECKING

from geoalchemy2 import Geography
from geoalchemy2.elements import WKBElement
from sqlalchemy import Boolean, Index, String, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.urgency import UrgencyRequest

_SENSITIVE = "SENSITIVE — never log in cleartext."


class Hospital(TimestampMixin, Base):
    """Care facility that can host an urgency request."""

    __tablename__ = "hospitals"
    __table_args__ = (
        Index("ix_hospitals_city", "city"),
        Index("ix_hospitals_is_recognized", "is_recognized"),
        Index("ix_hospitals_location", "location", postgresql_using="gist"),
        {
            "comment": (
                "Hospitals. contact_phone and location are SENSITIVE. "
                "Urgencies may only target rows with is_recognized = true."
            )
        },
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    location: Mapped[WKBElement | None] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=False),
        nullable=True,
        comment=f"Optional GPS (WGS84 geography). {_SENSITIVE}",
    )
    contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment=f"Demo contact phone. {_SENSITIVE}",
    )
    is_recognized: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        comment=(
            "State-recognized facility. Default false. "
            "Urgency requests may only target recognized hospitals."
        ),
    )

    urgency_requests: Mapped[list["UrgencyRequest"]] = relationship(
        back_populates="hospital",
    )
