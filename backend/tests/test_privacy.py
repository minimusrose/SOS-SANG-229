"""Public API schemas must not expose phone or GPS fields."""

from app.privacy import mask_phone
from app.schemas import (
    DonorPublic,
    HospitalPublic,
    MatchedDonorPublic,
    UrgencySummary,
    UrgencyTrackingRead,
)


def test_public_schemas_omit_phone_and_location() -> None:
    for schema in (
        DonorPublic,
        HospitalPublic,
        MatchedDonorPublic,
        UrgencySummary,
        UrgencyTrackingRead,
    ):
        fields = set(schema.model_fields)
        assert "phone" not in fields
        assert "contact_phone" not in fields
        assert "location" not in fields


def test_mask_phone_keeps_last_two_digits_only() -> None:
    assert mask_phone("+22900000099") == "***99"
    assert mask_phone("12") == "***12"
