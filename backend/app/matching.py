"""PostGIS donor matching for an urgency.

Default GPS radius: 15 km (15_000 m), overridable via MATCH_RADIUS_METERS.
When both hospital and donor have GPS, use distance (PostGIS ``ST_DWithin``
on geography, meters). Otherwise fall back to a case-insensitive city match.

Never log phone numbers, GPS coordinates, or blood groups.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from geoalchemy2.functions import ST_DWithin
from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.orm import Session

from app.enums import BloodGroup, MatchMethod
from app.geo import haversine_meters, parse_point, same_city
from app.models import Donor, Hospital

logger = logging.getLogger(__name__)

DEFAULT_RADIUS_METERS = 15_000

# Recipients can receive red cells from these donor groups (standard ABO/Rh).
_COMPATIBLE_DONORS: dict[BloodGroup, tuple[BloodGroup, ...]] = {
    BloodGroup.O_NEGATIVE: (BloodGroup.O_NEGATIVE,),
    BloodGroup.O_POSITIVE: (BloodGroup.O_NEGATIVE, BloodGroup.O_POSITIVE),
    BloodGroup.A_NEGATIVE: (BloodGroup.O_NEGATIVE, BloodGroup.A_NEGATIVE),
    BloodGroup.A_POSITIVE: (
        BloodGroup.O_NEGATIVE,
        BloodGroup.O_POSITIVE,
        BloodGroup.A_NEGATIVE,
        BloodGroup.A_POSITIVE,
    ),
    BloodGroup.B_NEGATIVE: (BloodGroup.O_NEGATIVE, BloodGroup.B_NEGATIVE),
    BloodGroup.B_POSITIVE: (
        BloodGroup.O_NEGATIVE,
        BloodGroup.O_POSITIVE,
        BloodGroup.B_NEGATIVE,
        BloodGroup.B_POSITIVE,
    ),
    BloodGroup.AB_NEGATIVE: (
        BloodGroup.O_NEGATIVE,
        BloodGroup.A_NEGATIVE,
        BloodGroup.B_NEGATIVE,
        BloodGroup.AB_NEGATIVE,
    ),
    BloodGroup.AB_POSITIVE: tuple(BloodGroup),
}


@dataclass(frozen=True)
class MatchResult:
    """A matched donor. Callers must not log phone / GPS / blood group."""

    donor: Donor
    method: MatchMethod
    distance_meters: float | None = None


def compatible_donor_groups(needed: BloodGroup) -> tuple[BloodGroup, ...]:
    """Donor groups that can give to ``needed``. Do not log ``needed``."""
    return _COMPATIBLE_DONORS[needed]


def donor_is_nearby(
    *,
    donor_has_location: bool,
    hospital_has_location: bool,
    distance_meters: float | None,
    cities_match: bool,
    radius_meters: int = DEFAULT_RADIUS_METERS,
) -> tuple[bool, MatchMethod | None]:
    """Decide GPS vs city fallback. Do not pass raw coordinates in."""
    if donor_has_location and hospital_has_location:
        if distance_meters is not None and distance_meters <= radius_meters:
            return True, MatchMethod.GPS
        return False, None
    if cities_match:
        return True, MatchMethod.CITY
    return False, None


def find_compatible_donors(
    session: Session,
    hospital: Hospital,
    needed: BloodGroup,
    radius_meters: int = DEFAULT_RADIUS_METERS,
) -> list[MatchResult]:
    """Return available compatible donors near the hospital.

    Production path uses PostGIS ``ST_DWithin`` (geography, meters).
    Tests / non-Postgres use the same GPS-or-city rules in Python.
    """
    groups = compatible_donor_groups(needed)
    bind = session.get_bind()
    dialect = bind.dialect.name if bind is not None else ""

    if dialect == "postgresql":
        results = _find_with_postgis(session, hospital, groups, radius_meters)
    else:
        results = _find_in_python(session, hospital, groups, radius_meters)

    logger.info(
        "Matching finished: %s candidate(s), radius_m=%s (no PII logged)",
        len(results),
        radius_meters,
    )
    return results


def _base_donor_filter(groups: tuple[BloodGroup, ...]) -> list:
    return [Donor.is_available.is_(True), Donor.blood_group.in_(groups)]


def _find_with_postgis(
    session: Session,
    hospital: Hospital,
    groups: tuple[BloodGroup, ...],
    radius_meters: int,
) -> list[MatchResult]:
    filters = _base_donor_filter(groups)
    city_clause = func.lower(func.trim(Donor.city)) == hospital.city.strip().lower()

    if hospital.location is None:
        stmt: Select[tuple[Donor]] = select(Donor).where(*filters, city_clause)
    else:
        gps_clause = and_(
            Donor.location.is_not(None),
            ST_DWithin(Donor.location, hospital.location, float(radius_meters)),
        )
        city_fallback = and_(Donor.location.is_(None), city_clause)
        stmt = select(Donor).where(*filters, or_(gps_clause, city_fallback))

    donors = list(session.scalars(stmt).unique().all())
    matched: list[MatchResult] = []
    for donor in donors:
        result = _classify_loaded_donor(donor, hospital, radius_meters)
        if result is not None:
            matched.append(result)
    return matched


def _find_in_python(
    session: Session,
    hospital: Hospital,
    groups: tuple[BloodGroup, ...],
    radius_meters: int,
) -> list[MatchResult]:
    donors = list(
        session.scalars(select(Donor).where(*_base_donor_filter(groups))).unique().all()
    )
    matched: list[MatchResult] = []
    for donor in donors:
        result = _classify_loaded_donor(donor, hospital, radius_meters)
        if result is not None:
            matched.append(result)
    return matched


def _classify_loaded_donor(
    donor: Donor,
    hospital: Hospital,
    radius_meters: int,
) -> MatchResult | None:
    donor_point = parse_point(donor.location)
    hospital_point = parse_point(hospital.location)
    distance: float | None = None
    if donor_point is not None and hospital_point is not None:
        distance = haversine_meters(donor_point, hospital_point)
    elif donor.location is not None and hospital.location is not None:
        # WKB from PostGIS: ST_DWithin already filtered; treat as GPS match.
        return MatchResult(donor=donor, method=MatchMethod.GPS, distance_meters=None)

    ok, method = donor_is_nearby(
        donor_has_location=donor.location is not None,
        hospital_has_location=hospital.location is not None,
        distance_meters=distance,
        cities_match=same_city(donor.city, hospital.city),
        radius_meters=radius_meters,
    )
    if not ok or method is None:
        return None
    return MatchResult(donor=donor, method=method, distance_meters=distance)
