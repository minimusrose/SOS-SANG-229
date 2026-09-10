"""Confirm a donation against an urgency (the current account's donor profile)."""

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.enums import DonationStatus, UrgencyStatus
from app.models import DonationConfirmation, Donor, UrgencyMatch, UrgencyRequest, User
from app.schemas.donation import DonationConfirmationCreate, DonationConfirmationRead

router = APIRouter(prefix="/donations", tags=["donations"])


@router.post(
    "",
    response_model=DonationConfirmationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Confirm my donation",
    description=(
        "The authenticated account confirms its donation for an urgency it was "
        "matched to. Increments `confirmed_donations_count` and marks the "
        "urgency fulfilled when enough units are confirmed. No phone numbers."
    ),
)
def confirm_donation(
    payload: DonationConfirmationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DonationConfirmation:
    donor = db.scalars(
        select(Donor).where(Donor.user_id == current_user.id)
    ).first()
    if donor is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Register as a donor before confirming a donation.",
        )

    urgency = db.get(UrgencyRequest, payload.urgency_request_id)
    if urgency is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Urgency request not found.",
        )
    if urgency.status == UrgencyStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot confirm a donation on a cancelled urgency.",
        )

    matched_id = db.scalar(
        select(UrgencyMatch.id)
        .where(
            UrgencyMatch.urgency_request_id == urgency.id,
            UrgencyMatch.donor_id == donor.id,
        )
        .limit(1)
    )
    if matched_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You were not matched to this request.",
        )

    existing = db.scalars(
        select(DonationConfirmation).where(
            DonationConfirmation.donor_id == donor.id,
            DonationConfirmation.urgency_request_id == urgency.id,
        )
    ).first()
    if existing is not None and existing.status == DonationStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already confirmed for this urgency.",
        )

    now = datetime.now(timezone.utc)
    if existing is not None:
        existing.status = DonationStatus.CONFIRMED
        existing.confirmed_at = now
        confirmation = existing
    else:
        confirmation = DonationConfirmation(
            id=uuid4(),
            donor_id=donor.id,
            urgency_request_id=urgency.id,
            status=DonationStatus.CONFIRMED,
            confirmed_at=now,
        )
        db.add(confirmation)
    urgency.confirmed_donations_count += 1
    if urgency.confirmed_donations_count >= urgency.units_needed:
        urgency.status = UrgencyStatus.FULFILLED

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already confirmed for this urgency.",
        ) from None

    db.refresh(confirmation)
    return confirmation
