from fastapi import APIRouter, Query
from app.services.planting_advisor import PlantingAdvisorService
from typing import Optional

router = APIRouter(prefix="/planting", tags=["Planting Advisor"])

@router.get("/crops")
def get_available_crops():
    calendar = PlantingAdvisorService.load_crop_calendar()
    return [
        {"id": k, "name_bn": v["name_bn"], "name_en": v["name_en"], "duration": v["growth_duration_days"]}
        for k, v in calendar.items()
    ]

@router.get("/advisor")
def get_advisor(
    crop_id: str = Query("aman_rice", description="Crop ID"),
    planting_date: Optional[str] = Query(None, description="Sowing date (YYYY-MM-DD)")
):
    advice = PlantingAdvisorService.get_planting_advice(crop_id, planting_date)
    return advice
