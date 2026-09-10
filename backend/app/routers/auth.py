"""Account registration and login (phone + password, JWT bearer)."""

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import exists, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.db import get_db
from app.models import Donor, User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_public(db: Session, user: User) -> UserPublic:
    has_donor = db.scalar(select(exists().where(Donor.user_id == user.id)))
    return UserPublic(
        id=user.id,
        phone=user.phone,
        display_name=user.display_name,
        has_donor_profile=bool(has_donor),
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an account",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    phone = payload.phone.strip()
    if db.scalar(select(exists().where(User.phone == phone))):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this phone already exists.",
        )
    user = User(
        id=uuid4(),
        phone=phone,
        display_name=payload.display_name.strip(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this phone already exists.",
        ) from None
    db.refresh(user)
    return AuthResponse(
        token=create_access_token(user.id),
        user=_user_public(db, user),
    )


@router.post("/login", response_model=AuthResponse, summary="Log in")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.scalars(
        select(User).where(User.phone == payload.phone.strip())
    ).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone or password.",
        )
    return AuthResponse(
        token=create_access_token(user.id),
        user=_user_public(db, user),
    )


@router.get("/me", response_model=UserPublic, summary="Current account")
def me(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserPublic:
    return _user_public(db, user)
