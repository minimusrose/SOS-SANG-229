"""Requester tracking. Phone numbers and GPS are omitted."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.models import UrgencyMatch, UrgencyRequest
from app.schemas.urgency import MatchedDonorPublic, UrgencySummary, UrgencyTrackingRead

router = APIRouter(prefix="/requests", tags=["tracking"])


def _to_summary(row: UrgencyRequest) -> UrgencySummary:
    return UrgencySummary(
        public_ref=row.public_ref,
        status=row.status,
        hospital_name=row.hospital.name,
        hospital_city=row.hospital.city,
        units_needed=row.units_needed,
        zone_label=row.zone_label,
        alerted_donors_count=row.alerted_donors_count,
        confirmed_donations_count=row.confirmed_donations_count,
        created_at=row.created_at,
    )


def _matched_public(matches: list[UrgencyMatch]) -> list[MatchedDonorPublic]:
    return [
        MatchedDonorPublic(
            donor_id=item.donor_id,
            display_name=item.donor.display_name,
            city=item.donor.city,
            match_method=item.match_method,
        )
        for item in matches
    ]


@router.get(
    "",
    response_model=list[UrgencySummary],
    summary="List urgency tracking summaries",
    description="Counts and status only. No phone numbers, GPS, or blood groups.",
)
def list_requests(db: Session = Depends(get_db)) -> list[UrgencySummary]:
    stmt = (
        select(UrgencyRequest)
        .options(selectinload(UrgencyRequest.hospital))
        .order_by(UrgencyRequest.created_at.desc())
    )
    return [_to_summary(row) for row in db.scalars(stmt).all()]


@router.get(
    "/{public_ref}",
    response_model=UrgencyTrackingRead,
    summary="Get urgency tracking status",
    description=(
        "Requester tracking by `public_ref` (for example REQ-DEMO-001). "
        "Includes counts, status, hospital label, and matched candidates "
        "without phone numbers."
    ),
)
def get_request(public_ref: str, db: Session = Depends(get_db)) -> UrgencyTrackingRead:
    stmt = (
        select(UrgencyRequest)
        .options(
            selectinload(UrgencyRequest.hospital),
            selectinload(UrgencyRequest.matches).selectinload(UrgencyMatch.donor),
        )
        .where(UrgencyRequest.public_ref == public_ref)
    )
    urgency = db.scalars(stmt).first()
    if urgency is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Urgency request not found.",
        )
    return UrgencyTrackingRead(
        public_ref=urgency.public_ref,
        status=urgency.status,
        blood_group_needed=urgency.blood_group_needed,
        patient_display_name=urgency.patient_display_name,
        hospital_id=urgency.hospital_id,
        hospital_name=urgency.hospital.name,
        hospital_city=urgency.hospital.city,
        units_needed=urgency.units_needed,
        zone_label=urgency.zone_label,
        alerted_donors_count=urgency.alerted_donors_count,
        confirmed_donations_count=urgency.confirmed_donations_count,
        matched_donors=_matched_public(list(urgency.matches)),
        created_at=urgency.created_at,
        updated_at=urgency.updated_at,
    )
