from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=schemas.ProfileOut)
def get_profile(
    current: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = current.profile
    if not p:
        p = models.UserProfile(user_id=current.id)
        db.add(p)
        db.commit()
        db.refresh(current)
        p = current.profile
    return p


@router.patch("", response_model=schemas.ProfileOut)
def update_profile(
    body: schemas.ProfileUpdate,
    current: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = current.profile
    if not p:
        p = models.UserProfile(user_id=current.id)
        db.add(p)
        db.flush()
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p
