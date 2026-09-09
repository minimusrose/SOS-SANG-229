"""Recognized hospitals for the urgency select. No phone or GPS in responses."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Hospital
from app.schemas.hospital import HospitalPublic

router = APIRouter(prefix="/hospitals", tags=["hospitals"])


@router.get(
    "",
    response_model=list[HospitalPublic],
    summary="List hospitals",
    description=(
        "By default returns only state-recognized facilities "
        "(`is_recognized=true`) for the urgency select. "
        "Contact phone and GPS are omitted."
    ),
)
def list_hospitals(
    is_recognized: bool = True,
    db: Session = Depends(get_db),
) -> list[Hospital]:
    stmt = (
        select(Hospital)
        .where(Hospital.is_recognized.is_(is_recognized))
        .order_by(Hospital.name)
    )
    return list(db.scalars(stmt).all())


@router.get(
    "/recognized",
    response_model=list[HospitalPublic],
    summary="List recognized hospitals",
    description="Alias of GET /hospitals?is_recognized=true. No phone or GPS.",
)
def list_recognized_hospitals(db: Session = Depends(get_db)) -> list[Hospital]:
    return list_hospitals(is_recognized=True, db=db)
