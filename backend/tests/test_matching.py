"""Matching rules: ABO/Rh compatibility, GPS radius, city fallback."""

import json
from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy.orm import Session

from app.enums import BloodGroup, MatchMethod
from app.geo import geopoint_to_wkt, parse_point
from app.matching import (
    DEFAULT_RADIUS_METERS,
    compatible_donor_groups,
    donor_is_nearby,
    find_compatible_donors,
)
from app.models import Donor, Hospital
from app.schemas.common import GeoPoint

# Textbook ABO/Rh rule, derived independently from `_COMPATIBLE_DONORS` so this
# test can't just be checking the table against itself: a donor's red cells
# are compatible when the recipient's plasma carries no antibody against them
# (ABO) and the recipient can accept the donor's Rh(D) status.
_ABO_ACCEPTS: dict[str, set[str]] = {
    "O": {"O", "A", "B", "AB"},
    "A": {"A", "AB"},
    "B": {"B", "AB"},
    "AB": {"AB"},
}


def _expected_compatible(donor: BloodGroup, recipient: BloodGroup) -> bool:
    donor_abo, donor_rh = donor.value[:-1], donor.value[-1]
    recipient_abo, recipient_rh = recipient.value[:-1], recipient.value[-1]
    if recipient_abo not in _ABO_ACCEPTS[donor_abo]:
        return False
    if donor_rh == "+" and recipient_rh == "-":
        return False
    return True


def test_parse_point_accepts_wkt_and_ewkt() -> None:
    wkt = parse_point("POINT(2.42 6.37)")
    ewkt = parse_point("SRID=4326;POINT(2.42 6.37)")
    assert wkt == ewkt
    assert wkt is not None
    assert wkt.latitude == 6.37
    assert wkt.longitude == 2.42
    assert parse_point(None) is None


def test_default_radius_is_15_km() -> None:
    assert DEFAULT_RADIUS_METERS == 15_000


def test_o_negative_donates_only_o_negative() -> None:
    assert compatible_donor_groups(BloodGroup.O_NEGATIVE) == (BloodGroup.O_NEGATIVE,)


def test_ab_positive_receives_from_all() -> None:
    groups = compatible_donor_groups(BloodGroup.AB_POSITIVE)
    assert set(groups) == set(BloodGroup)


def test_o_positive_does_not_receive_a_positive() -> None:
    groups = compatible_donor_groups(BloodGroup.O_POSITIVE)
    assert BloodGroup.A_POSITIVE not in groups
    assert BloodGroup.O_NEGATIVE in groups
    assert BloodGroup.O_POSITIVE in groups


@pytest.mark.parametrize("donor", list(BloodGroup))
@pytest.mark.parametrize("recipient", list(BloodGroup))
def test_all_64_donor_recipient_combinations(
    donor: BloodGroup, recipient: BloodGroup
) -> None:
    """Every (donor, recipient) pair matches the standard ABO/Rh rule.

    Covers the same lookup the "Testez votre compatibilité" modal and the
    urgency matching both rely on (`compatible_donor_groups`), so a bug here
    would surface in both places at once.
    """
    actual = donor in compatible_donor_groups(recipient)
    assert actual == _expected_compatible(donor, recipient), (
        f"{donor.value} -> {recipient.value}: expected "
        f"{_expected_compatible(donor, recipient)}, got {actual}"
    )


def test_generated_frontend_table_matches_compatible_donor_groups() -> None:
    """Guards against a stale `bloodCompatibility.generated.json`.

    That file is a static export of this same table for the frontend
    compatibility-test modal (no API call from the browser). If someone edits
    `_COMPATIBLE_DONORS` without re-running
    `scripts/export_blood_compatibility.py`, this test fails instead of the
    browser silently serving an outdated rule.
    """
    json_path = (
        Path(__file__).resolve().parents[2]
        / "frontend"
        / "src"
        / "data"
        / "bloodCompatibility.generated.json"
    )
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    expected = {
        (pair["donor"], pair["recipient"]): pair["compatible"]
        for pair in payload["pairs"]
    }
    assert len(expected) == 64
    for recipient in BloodGroup:
        donors = compatible_donor_groups(recipient)
        for donor in BloodGroup:
            key = (donor.value, recipient.value)
            assert expected[key] == (donor in donors), (
                f"{json_path.name} is stale for {donor.value} -> "
                f"{recipient.value}; re-run "
                "scripts/export_blood_compatibility.py"
            )


def test_gps_match_inside_radius() -> None:
    ok, method = donor_is_nearby(
        donor_has_location=True,
        hospital_has_location=True,
        distance_meters=4_000,
        cities_match=False,
        radius_meters=DEFAULT_RADIUS_METERS,
    )
    assert ok is True
    assert method is MatchMethod.GPS


def test_gps_rejects_outside_radius_even_if_same_city() -> None:
    ok, method = donor_is_nearby(
        donor_has_location=True,
        hospital_has_location=True,
        distance_meters=20_000,
        cities_match=True,
        radius_meters=DEFAULT_RADIUS_METERS,
    )
    assert ok is False
    assert method is None


def test_city_fallback_when_gps_missing() -> None:
    ok, method = donor_is_nearby(
        donor_has_location=False,
        hospital_has_location=True,
        distance_meters=None,
        cities_match=True,
    )
    assert ok is True
    assert method is MatchMethod.CITY


def test_no_match_when_no_gps_and_different_city() -> None:
    ok, method = donor_is_nearby(
        donor_has_location=False,
        hospital_has_location=False,
        distance_meters=None,
        cities_match=False,
    )
    assert ok is False
    assert method is None


def test_find_compatible_donors_gps_and_city_fallback(db_session: Session) -> None:
    hospital = Hospital(
        id=uuid4(),
        name="Hopital Demo",
        city="Zone Demo",
        is_recognized=True,
        location=geopoint_to_wkt(GeoPoint(latitude=6.37, longitude=2.42)),
    )
    gps_near = Donor(
        id=uuid4(),
        display_name="Donneur Demo GPS",
        blood_group=BloodGroup.O_NEGATIVE,
        phone="+22900000021",
        city="Ville Demo",
        location=geopoint_to_wkt(GeoPoint(latitude=6.375, longitude=2.42)),
        is_available=True,
    )
    gps_far = Donor(
        id=uuid4(),
        display_name="Donneur Demo Hors Rayon",
        blood_group=BloodGroup.O_NEGATIVE,
        phone="+22900000022",
        city="Zone Demo",
        location=geopoint_to_wkt(GeoPoint(latitude=6.60, longitude=2.42)),
        is_available=True,
    )
    city_only = Donor(
        id=uuid4(),
        display_name="Donneur Demo Ville",
        blood_group=BloodGroup.O_POSITIVE,
        phone="+22900000023",
        city="zone demo",
        location=None,
        is_available=True,
    )
    db_session.add_all([hospital, gps_near, gps_far, city_only])
    db_session.commit()

    results = find_compatible_donors(
        db_session,
        hospital,
        BloodGroup.O_POSITIVE,
        radius_meters=DEFAULT_RADIUS_METERS,
    )
    by_id = {item.donor.id: item for item in results}
    assert set(by_id) == {gps_near.id, city_only.id}
    assert by_id[gps_near.id].method is MatchMethod.GPS
    assert by_id[city_only.id].method is MatchMethod.CITY
    assert gps_far.id not in by_id
