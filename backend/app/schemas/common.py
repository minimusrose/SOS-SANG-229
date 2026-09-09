"""Shared Pydantic types. Mark sensitive GPS/health fields clearly."""

from pydantic import BaseModel, Field

SENSITIVE_NOTE = "Sensitive field (phone, GPS, or blood group). Never log in cleartext."


class GeoPoint(BaseModel):
    """WGS84 point used for optional donor/hospital location.

    SENSITIVE GPS data — never log latitude/longitude in cleartext.
    """

    latitude: float = Field(..., ge=-90, le=90, description=SENSITIVE_NOTE)
    longitude: float = Field(..., ge=-180, le=180, description=SENSITIVE_NOTE)
