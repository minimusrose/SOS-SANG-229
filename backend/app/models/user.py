"""Account (User) ORM model. One account = phone + password."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Index, String, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.donor import Donor
    from app.models.urgency import UrgencyRequest

_SENSITIVE = "SENSITIVE — never log in cleartext."


class User(TimestampMixin, Base):
    """A person with an account.

    ``phone`` is the unique login identifier. A user MAY have one donor profile
    and MAY have opened several urgency requests.
    """

    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_phone", "phone"),
        {"comment": "Accounts. phone and password_hash are SENSITIVE."},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        unique=True,
        comment=f"E.164-style phone, the login id. {_SENSITIVE}",
    )
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment=f"bcrypt hash. {_SENSITIVE}",
    )

    donor: Mapped["Donor | None"] = relationship(back_populates="user", uselist=False)
    requests: Mapped[list["UrgencyRequest"]] = relationship(back_populates="requester")
