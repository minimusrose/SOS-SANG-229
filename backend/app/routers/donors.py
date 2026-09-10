"""Donor registration for the authenticated account. Responses omit phone/GPS."""

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import exists, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.geo import geopoint_to_wkt
from app.models import Donor, User
from app.schemas.donor import DonorCreate, DonorPublic

router = APIRouter(prefix="/donors", tags=["donors"])


@router.post(
    "",
    response_model=DonorPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Register the current account as a donor",
    description=(
        "Creates the donor profile for the authenticated account (one per "
        "account). The phone is taken from the account; the response omits "
        "phone and GPS."
    ),
)
def create_donor(
    payload: DonorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Donor:
    if db.scalar(select(exists().where(Donor.user_id == current_user.id))):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This account already has a donor profile.",
        )
    donor = Donor(
        id=uuid4(),
        user_id=current_user.id,
        display_name=(payload.display_name or current_user.display_name).strip(),
        blood_group=payload.blood_group,
        phone=current_user.phone,
        city=payload.city,
        location=geopoint_to_wkt(payload.location),
        is_available=payload.is_available,
    )
    db.add(donor)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A donor profile already exists for this account or phone.",
        ) from None
    db.refresh(donor)
    return donor
