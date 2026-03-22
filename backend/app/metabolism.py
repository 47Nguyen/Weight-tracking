"""Rough estimates for scenario comparison — not medical advice."""

from typing import Literal

Gender = Literal["male", "female", "other"]
Exercise = Literal["sedentary", "light", "moderate", "active", "very_active"]

ACTIVITY_MULTIPLIERS: dict[Exercise, float] = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}

# kcal per kg body fat mass (common rule of thumb)
KCAL_PER_KG_FAT = 7700
# moderate pace: ~0.5 kg/week
WEEKLY_KG_MODERATE = 0.5
DAILY_DEFICIT_MODERATE = (WEEKLY_KG_MODERATE * KCAL_PER_KG_FAT) / 7


def mifflin_st_jeor_bmr(weight_kg: float, height_cm: float, age: int, gender: Gender) -> float:
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    if gender == "male":
        return base + 5
    if gender == "female":
        return base - 161
    # midpoint for "other" — transparent compromise for UI comparison only
    return base - 78


def tdee_kcal(bmr: float, exercise: Exercise) -> float:
    return bmr * ACTIVITY_MULTIPLIERS[exercise]


def scenario_metrics(
    *,
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: Gender,
    exercise: Exercise,
    target_weight_kg: float,
) -> dict:
    bmr = mifflin_st_jeor_bmr(weight_kg, height_cm, age, gender)
    tdee = tdee_kcal(bmr, exercise)
    weight_to_lose = max(0.0, weight_kg - target_weight_kg)

    # Cap deficit: stay within ~25% of TDEE and not below ~1200 kcal intake for adults (soft guard)
    max_deficit = min(0.25 * tdee, tdee - 1200)
    desired_deficit = min(DAILY_DEFICIT_MODERATE, max_deficit) if max_deficit > 0 else 0.0
    suggested_intake = max(1200.0, tdee - desired_deficit)
    actual_deficit = tdee - suggested_intake

    if weight_to_lose <= 0 or actual_deficit <= 0:
        days = None
    else:
        days = (weight_to_lose * KCAL_PER_KG_FAT) / actual_deficit

    # Sustainability: prefer moderate deficit; penalize very aggressive % of TDEE
    deficit_ratio = actual_deficit / tdee if tdee else 0
    if deficit_ratio <= 0.15:
        sustain = 100 - deficit_ratio * 200
    elif deficit_ratio <= 0.22:
        sustain = 92 - (deficit_ratio - 0.15) * 400
    else:
        sustain = max(40, 75 - (deficit_ratio - 0.22) * 500)

    # Composite rank score: faster progress slightly rewarded, sustainability heavily weighted
    time_component = 1000 / (days + 30) if days else 0
    score = 0.65 * sustain + 0.35 * min(time_component, 25)

    return {
        "bmr_kcal": round(bmr, 1),
        "tdee_kcal": round(tdee, 1),
        "suggested_intake_kcal": round(suggested_intake, 1),
        "daily_deficit_kcal": round(actual_deficit, 1),
        "estimated_days_to_target": round(days, 1) if days is not None else None,
        "sustainability_score": round(min(100, max(0, sustain)), 1),
        "_rank_score": score,
    }
