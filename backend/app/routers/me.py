"""Personalised views for the authenticated account: my requests, my matches."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth import get_current_user
from app.db import get_db
from app.enums import DonationStatus
from app.geo import geopoint_to_wkt
from app.models import (
    DonationConfirmation,
    Donor,
    UrgencyMatch,
    UrgencyRequest,
    User,
)
from app.schemas.donor import DonorProfileRead, DonorProfileUpdate
from app.schemas.urgency import MatchedRequestSummary, MyRequestSummary

router = APIRouter(prefix="/me", tags=["me"])


def _require_donor(db: Session, user: User) -> Donor:
    donor = db.scalars(select(Donor).where(Donor.user_id == user.id)).first()
    if donor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This account has no donor profile.",
        )
    return donor


def _profile(user: User, donor: Donor) -> DonorProfileRead:
    return DonorProfileRead(
        display_name=donor.display_name,
        phone=user.phone,
        blood_group=donor.blood_group,
        city=donor.city,
        is_available=donor.is_available,
        has_location=donor.location is not None,
    )


@router.get(
    "/donor-profile",
    response_model=DonorProfileRead,
    summary="My donor information",
)
def get_donor_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DonorProfileRead:
    return _profile(current_user, _require_donor(db, current_user))


@router.patch(
    "/donor-profile",
    response_model=DonorProfileRead,
    summary="Update my donor information",
)
def update_donor_profile(
    payload: DonorProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DonorProfileRead:
    donor = _require_donor(db, current_user)
    if payload.display_name is not None:
        name = payload.display_name.strip()
        current_user.display_name = name
        donor.display_name = name
    if payload.blood_group is not None:
        donor.blood_group = payload.blood_group
    if payload.city is not None:
        donor.city = payload.city.strip()
    if payload.is_available is not None:
        donor.is_available = payload.is_available
    if payload.location is not None:
        donor.location = geopoint_to_wkt(payload.location)
    db.commit()
    db.refresh(donor)
    db.refresh(current_user)
    return _profile(current_user, donor)


@router.get(
    "/requests",
    response_model=list[MyRequestSummary],
    summary="Requests I have opened",
)
def my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MyRequestSummary]:
    rows = db.scalars(
        select(UrgencyRequest)
        .options(selectinload(UrgencyRequest.hospital))
        .where(UrgencyRequest.requester_user_id == current_user.id)
        .order_by(UrgencyRequest.created_at.desc())
    ).all()
    return [
        MyRequestSummary(
            id=row.id,
            public_ref=row.public_ref,
            status=row.status,
            blood_group_needed=row.blood_group_needed,
            hospital_name=row.hospital.name,
            hospital_city=row.hospital.city,
            units_needed=row.units_needed,
            zone_label=row.zone_label,
            alerted_donors_count=row.alerted_donors_count,
            confirmed_donations_count=row.confirmed_donations_count,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.get(
    "/matches",
    response_model=list[MatchedRequestSummary],
    summary="Requests I was matched to as a donor",
)
def my_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MatchedRequestSummary]:
    donor = db.scalars(
        select(Donor).where(Donor.user_id == current_user.id)
    ).first()
    if donor is None:
        return []

    rows = db.execute(
        select(UrgencyRequest)
        .join(UrgencyMatch, UrgencyMatch.urgency_request_id == UrgencyRequest.id)
        .options(selectinload(UrgencyRequest.hospital))
        .where(UrgencyMatch.donor_id == donor.id)
        .order_by(UrgencyRequest.created_at.desc())
    ).scalars().all()

    confirmed_ids = set(
        db.scalars(
            select(DonationConfirmation.urgency_request_id).where(
                DonationConfirmation.donor_id == donor.id,
                DonationConfirmation.status == DonationStatus.CONFIRMED,
            )
        ).all()
    )

    return [
        MatchedRequestSummary(
            id=row.id,
            public_ref=row.public_ref,
            status=row.status,
            blood_group_needed=row.blood_group_needed,
            hospital_name=row.hospital.name,
            hospital_city=row.hospital.city,
            units_needed=row.units_needed,
            zone_label=row.zone_label,
            alerted_donors_count=row.alerted_donors_count,
            confirmed_donations_count=row.confirmed_donations_count,
            created_at=row.created_at,
            i_confirmed=row.id in confirmed_ids,
        )
        for row in rows
    ]
