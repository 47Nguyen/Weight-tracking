from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/weights", tags=["weights"])


@router.get("", response_model=list[schemas.WeightEntryOut])
def list_weights(
    current: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.WeightEntry)
        .filter(models.WeightEntry.user_id == current.id)
        .order_by(models.WeightEntry.entry_date.asc())
        .all()
    )


@router.post("", response_model=schemas.WeightEntryOut)
def upsert_weight(
    body: schemas.WeightEntryCreate,
    current: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(models.WeightEntry)
        .filter(
            models.WeightEntry.user_id == current.id,
            models.WeightEntry.entry_date == body.entry_date,
        )
        .first()
    )
    if existing:
        existing.weight_kg = body.weight_kg
        db.commit()
        db.refresh(existing)
        return existing
    row = models.WeightEntry(user_id=current.id, entry_date=body.entry_date, weight_kg=body.weight_kg)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{entry_date}", status_code=204)
def delete_weight(
    entry_date: date,
    current: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = (
        db.query(models.WeightEntry)
        .filter(models.WeightEntry.user_id == current.id, models.WeightEntry.entry_date == entry_date)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(row)
    db.commit()
    return None
