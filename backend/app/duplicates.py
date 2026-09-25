"""Duplicate-patient guard for new urgency requests.

Before an alert is created, we check whether a non-fulfilled ("non pourvue")
alert already exists for the same patient name (normalized) AND the exact
same blood group requested — only that combination is confident enough to
block creation, and only those exact-matching alerts are surfaced in the
message. A name match where the blood group differs is treated as too
uncertain and is ignored entirely (product decision): it neither warns nor
blocks, and its identifier is never listed even when another alert of the
same name does match exactly.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.enums import BloodGroup
from app.models import UrgencyRequest
from app.status import display_status
from app.text import normalize_patient_name

_NON_FULFILLED_DISPLAY_STATUSES = {"open", "alerting"}


def find_duplicate_patient_alerts(
    db: Session,
    *,
    patient_display_name: str,
    blood_group_needed: BloodGroup,
) -> list[UrgencyRequest]:
    target_name = normalize_patient_name(patient_display_name)
    if not target_name:
        return []

    rows = db.scalars(select(UrgencyRequest)).all()
    return [
        row
        for row in rows
        if normalize_patient_name(row.patient_display_name) == target_name
        and row.blood_group_needed == blood_group_needed
        and display_status(row.status, row.confirmed_donations_count, row.units_needed)
        in _NON_FULFILLED_DISPLAY_STATUSES
    ]


def duplicate_patient_message(public_refs: list[str]) -> str:
    if len(public_refs) == 1:
        return (
            "Une alerte non pourvue existe déjà au nom de ce patient, pour "
            "le même groupe sanguin. Il s'agit très probablement de la même "
            f"personne. Consultez l'alerte existante avec l'identifiant "
            f"{public_refs[0]} sur la page Demandes en cours."
        )
    joined = ", ".join(public_refs)
    return (
        "Une alerte non pourvue existe déjà au nom de ce patient, pour le "
        "même groupe sanguin. Il s'agit très probablement de la même "
        f"personne. Consultez les alertes existantes avec les identifiants "
        f"{joined} sur la page Demandes en cours."
    )
