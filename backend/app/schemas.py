from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    username: str = Field(min_length=2, max_length=64)
    password: str = Field(min_length=6, max_length=128)


class UserOut(BaseModel):
    id: int
    username: str

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    target_weight_kg: float | None = None
    height_cm: float | None = Field(None, ge=50, le=260)
    age: int | None = Field(None, ge=10, le=120)
    gender: Literal["male", "female", "other"] | None = None
    exercise_level: Literal["sedentary", "light", "moderate", "active", "very_active"] | None = None


class ProfileOut(BaseModel):
    target_weight_kg: float | None
    height_cm: float | None
    age: int | None
    gender: str | None
    exercise_level: str | None

    model_config = {"from_attributes": True}


class WeightEntryCreate(BaseModel):
    entry_date: date
    weight_kg: float = Field(gt=0, le=500)


class WeightEntryOut(BaseModel):
    id: int
    entry_date: date
    weight_kg: float

    model_config = {"from_attributes": True}


class ScenarioInput(BaseModel):
    label: str | None = None
    gender: Literal["male", "female", "other"]
    age: int = Field(ge=10, le=120)
    exercise_level: Literal["sedentary", "light", "moderate", "active", "very_active"]


class CompareScenariosRequest(BaseModel):
    """Uses your latest logged weight (or override) plus height for metabolic estimates."""

    current_weight_kg: float | None = Field(None, gt=0, le=500)
    target_weight_kg: float = Field(gt=0, le=500)
    height_cm: float = Field(ge=50, le=260)
    scenarios: list[ScenarioInput] = Field(min_length=1, max_length=8)

    @field_validator("scenarios")
    @classmethod
    def unique_enough(cls, v: list[ScenarioInput]) -> list[ScenarioInput]:
        return v


class ScenarioResult(BaseModel):
    label: str | None
    gender: str
    age: int
    exercise_level: str
    bmr_kcal: float
    tdee_kcal: float
    suggested_intake_kcal: float
    daily_deficit_kcal: float
    estimated_days_to_target: float | None
    sustainability_score: float
    rank: int


class CompareScenariosResponse(BaseModel):
    current_weight_kg: float
    target_weight_kg: float
    weight_to_lose_kg: float
    best_rank: int
    scenarios: list[ScenarioResult]
    disclaimer: str
