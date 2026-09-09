"""Matching rules: ABO/Rh compatibility, GPS radius, city fallback."""

from app.enums import BloodGroup, MatchMethod
from app.matching import (
    DEFAULT_RADIUS_METERS,
    compatible_donor_groups,
    donor_is_nearby,
)


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
