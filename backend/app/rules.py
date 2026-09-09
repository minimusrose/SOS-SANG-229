"""Domain rules for later API work. No HTTP layer here."""

from app.models import Hospital

UNRECOGNIZED_HOSPITAL_MESSAGE = (
    "Urgency requests may only target a state-recognized hospital "
    "(hospitals.is_recognized must be true)."
)


class UnrecognizedHospitalError(ValueError):
    """Raised when an urgency would target a hospital that is not recognized."""


def require_recognized_hospital(hospital: Hospital) -> None:
    """Reject unrecognized facilities. Call this before inserting an urgency."""
    if not hospital.is_recognized:
        raise UnrecognizedHospitalError(UNRECOGNIZED_HOSPITAL_MESSAGE)
