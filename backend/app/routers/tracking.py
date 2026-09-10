"""Single-request tracking detail. Restricted to the requester or a matched donor."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth import get_current_user
from app.db import get_db
from app.models import Donor, UrgencyMatch, UrgencyRequest, User
from app.schemas.urgency import MatchedDonorPublic, UrgencyTrackingRead

router = APIRouter(prefix="/requests", tags=["tracking"])


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
    "/{public_ref}",
    response_model=UrgencyTrackingRead,
    summary="Get one request's tracking status",
    description=(
        "By `public_ref`. Allowed only for the account that opened the request "
        "or an account matched to it as a donor. No phone numbers or GPS."
    ),
)
def get_request(
    public_ref: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UrgencyTrackingRead:
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

    is_requester = urgency.requester_user_id == current_user.id
    donor = db.scalars(
        select(Donor).where(Donor.user_id == current_user.id)
    ).first()
    is_matched_donor = donor is not None and any(
        m.donor_id == donor.id for m in urgency.matches
    )
    if not (is_requester or is_matched_donor):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot view this request.",
        )

    return UrgencyTrackingRead(
        id=urgency.id,
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
