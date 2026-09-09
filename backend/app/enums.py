"""Shared domain enums (ORM + Pydantic)."""

from enum import Enum


class BloodGroup(str, Enum):
    """ABO/Rh group. SENSITIVE health data — never log the raw value."""

    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"


class UrgencyStatus(str, Enum):
    """Lifecycle of an emergency / urgence request."""

    OPEN = "open"
    ALERTING = "alerting"
    FULFILLED = "fulfilled"
    CANCELLED = "cancelled"


class DonationStatus(str, Enum):
    """Lifecycle of a donor confirmation against an urgency."""

    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class MatchMethod(str, Enum):
    """How a donor was matched to an urgency. Never log GPS or city with PII."""

    GPS = "gps"
    CITY = "city"
