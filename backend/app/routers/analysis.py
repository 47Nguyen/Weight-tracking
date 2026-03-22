from fastapi import APIRouter, Depends, HTTPException

from app import models, schemas
from app.auth import get_current_user
from sqlalchemy.orm import Session

from app.database import get_db
from app.metabolism import scenario_metrics

router = APIRouter(prefix="/analysis", tags=["analysis"])

DISCLAIMER = (
    "Estimates use the Mifflin–St Jeor equation and activity multipliers for comparison only. "
    "They are not medical advice; consult a professional for personalized plans."
)


@router.post("/compare-scenarios", response_model=schemas.CompareScenariosResponse)
def compare_scenarios(
    body: schemas.CompareScenariosRequest,
    current: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    height_cm = body.height_cm

    weight_kg = body.current_weight_kg
    if weight_kg is None:
        latest = (
            db.query(models.WeightEntry)
            .filter(models.WeightEntry.user_id == current.id)
            .order_by(models.WeightEntry.entry_date.desc())
            .first()
        )
        if not latest:
            raise HTTPException(
                status_code=400,
                detail="Log at least one weight entry or pass current_weight_kg.",
            )
        weight_kg = latest.weight_kg

    target = body.target_weight_kg
    if weight_kg < target:
        raise HTTPException(status_code=400, detail="Current weight must be at or above target for loss scenarios.")

    results = []
    for i, s in enumerate(body.scenarios):
        m = scenario_metrics(
            weight_kg=weight_kg,
            height_cm=height_cm,
            age=s.age,
            gender=s.gender,
            exercise=s.exercise_level,
            target_weight_kg=target,
        )
        rank_score = m.pop("_rank_score")
        results.append(
            (
                rank_score,
                schemas.ScenarioResult(
                    label=s.label or f"Scenario {i + 1}",
                    gender=s.gender,
                    age=s.age,
                    exercise_level=s.exercise_level,
                    bmr_kcal=m["bmr_kcal"],
                    tdee_kcal=m["tdee_kcal"],
                    suggested_intake_kcal=m["suggested_intake_kcal"],
                    daily_deficit_kcal=m["daily_deficit_kcal"],
                    estimated_days_to_target=m["estimated_days_to_target"],
                    sustainability_score=m["sustainability_score"],
                    rank=0,
                ),
            )
        )

    results.sort(key=lambda x: x[0], reverse=True)
    ranked = []
    for r, (_, row) in enumerate(results, start=1):
        ranked.append(row.model_copy(update={"rank": r}))

    best = ranked[0].rank if ranked else 1
    wlose = max(0.0, weight_kg - target)

    return schemas.CompareScenariosResponse(
        current_weight_kg=round(weight_kg, 2),
        target_weight_kg=target,
        weight_to_lose_kg=round(wlose, 2),
        best_rank=best,
        scenarios=ranked,
        disclaimer=DISCLAIMER,
    )
