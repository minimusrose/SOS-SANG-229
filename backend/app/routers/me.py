"""Personalised views for the authenticated account: my requests, my matches."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth import get_current_user
from app.db import get_db
from app.enums import DonationStatus
from app.models import (
    DonationConfirmation,
    Donor,
    UrgencyMatch,
    UrgencyRequest,
    User,
)
from app.schemas.urgency import MatchedRequestSummary, MyRequestSummary

router = APIRouter(prefix="/me", tags=["me"])


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
