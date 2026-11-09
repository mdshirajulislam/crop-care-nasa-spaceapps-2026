from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Plot, User
from app.services.crop_care_advisor import CropCareAdvisorService
from pydantic import BaseModel
from typing import Optional, List
import json

router = APIRouter(prefix="/plots", tags=["Land & Plot Management"])

class PlotCreate(BaseModel):
    name: str
    crop_name: str
    crop_variety: Optional[str] = "উন্নত জাত"
    planting_date: Optional[str] = "2026-07-20"
    area_value: float
    area_unit: str = "bigha"
    soil_type: Optional[str] = "দোআঁশ মাটি"
    irrigation_source: Optional[str] = "গভীর নলকূপ"
    polygon_geojson: Optional[str] = None

class PlotUpdate(BaseModel):
    name: Optional[str] = None
    crop_name: Optional[str] = None
    crop_variety: Optional[str] = None
    planting_date: Optional[str] = None
    area_value: Optional[float] = None
    area_unit: Optional[str] = None
    soil_type: Optional[str] = None
    irrigation_source: Optional[str] = None
    current_stage: Optional[str] = None
    health_status: Optional[str] = None
    ndvi_score: Optional[float] = None
    polygon_geojson: Optional[str] = None
    completed_tasks: Optional[str] = None

class ToggleTaskRequest(BaseModel):
    task_id: str
    completed: bool

class AdvisoryCalculateRequest(BaseModel):
    crop_name: str
    planting_date: Optional[str] = "2026-07-20"
    crop_variety: Optional[str] = ""
    soil_type: Optional[str] = "দোআঁশ মাটি"
    area_value: float = 1.0
    area_unit: str = "bigha"
    irrigation_source: Optional[str] = "গভীর নলকূপ"
    completed_tasks: Optional[List[str]] = []

@router.get("/")
def get_plots(db: Session = Depends(get_db)):
    plots = db.query(Plot).all()
    if not plots:
        user = db.query(User).first()
        user_id = user.id if user else 1
        default_plot = Plot(
            user_id=user_id,
            name="প্লট ১ - পূর্বের মাঠ",
            crop_name="আমন ধান",
            crop_variety="ব্রি ধান ৪৯",
            planting_date="2026-07-20",
            expected_harvest_date="2026-11-25",
            area_value=3.5,
            area_unit="bigha",
            soil_type="দোআঁশ মাটি",
            irrigation_source="গভীর নলকূপ",
            current_stage="কুশি গজানো পর্যায় (Tillering Stage)",
            health_status="ভালো (Good)",
            ndvi_score=0.68,
            completed_tasks="[]"
        )
        db.add(default_plot)
        db.commit()
        db.refresh(default_plot)
        plots = [default_plot]
    
    total_bigha = sum(p.area_value for p in plots)
    return {
        "plots": plots,
        "summary": {
            "total_plots_count": len(plots),
            "total_land_bigha": round(total_bigha, 2),
            "total_land_decimal": round(total_bigha * 33.0, 1),
            "current_crops_label_bn": f"{plots[0].crop_name} ({len(plots)}টি প্লট)" if plots else "কোনো ফসল নেই",
            "total_land_label_bn": f"{round(total_bigha, 2)} বিঘা ({round(total_bigha * 33.0, 1)} শতক)"
        }
    }

@router.post("/calculate-advisory")
def calculate_advisory(data: AdvisoryCalculateRequest):
    advisory = CropCareAdvisorService.generate_crop_advisory(
        crop_name=data.crop_name,
        planting_date_str=data.planting_date or "2026-07-20",
        crop_variety=data.crop_variety,
        soil_type=data.soil_type,
        area_value=data.area_value,
        area_unit=data.area_unit,
        irrigation_source=data.irrigation_source,
        completed_tasks_list=data.completed_tasks or []
    )
    return advisory

@router.get("/{plot_id}/advisory")
def get_plot_advisory(plot_id: int, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="প্লট পাওয়া যায়নি")
    
    try:
        completed = json.loads(plot.completed_tasks or "[]")
    except Exception:
        completed = []
        
    advisory = CropCareAdvisorService.generate_crop_advisory(
        crop_name=plot.crop_name,
        planting_date_str=plot.planting_date or "2026-07-20",
        crop_variety=plot.crop_variety,
        soil_type=plot.soil_type,
        area_value=plot.area_value,
        area_unit=plot.area_unit or "bigha",
        irrigation_source=plot.irrigation_source,
        completed_tasks_list=completed
    )
    advisory["plot_id"] = plot.id
    advisory["plot_name"] = plot.name
    return advisory

@router.post("/{plot_id}/toggle-task")
def toggle_plot_task(plot_id: int, data: ToggleTaskRequest, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="প্লট পাওয়া যায়নি")
    
    try:
        tasks = json.loads(plot.completed_tasks or "[]")
    except Exception:
        tasks = []
    
    if data.completed:
        if data.task_id not in tasks:
            tasks.append(data.task_id)
    else:
        if data.task_id in tasks:
            tasks.remove(data.task_id)
            
    plot.completed_tasks = json.dumps(tasks)
    db.commit()
    db.refresh(plot)
    return {"status": "success", "completed_tasks": tasks}

@router.post("/")
def create_plot(data: PlotCreate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    user_id = user.id if user else 1

    # Auto-calculate current growth stage from real sowing date
    temp_adv = CropCareAdvisorService.generate_crop_advisory(
        crop_name=data.crop_name,
        planting_date_str=data.planting_date or "2026-07-20",
        crop_variety=data.crop_variety,
        soil_type=data.soil_type,
        area_value=data.area_value,
        area_unit=data.area_unit,
        irrigation_source=data.irrigation_source
    )
    stage_name = temp_adv["planting_info"]["current_stage"]["name_bn"]

    new_plot = Plot(
        user_id=user_id,
        name=data.name,
        crop_name=data.crop_name,
        crop_variety=data.crop_variety or "উন্নত জাত",
        planting_date=data.planting_date or "2026-07-20",
        area_value=data.area_value,
        area_unit=data.area_unit or "bigha",
        soil_type=data.soil_type or "দোআঁশ মাটি",
        irrigation_source=data.irrigation_source or "গভীর নলকূপ",
        polygon_geojson=data.polygon_geojson,
        current_stage=stage_name,
        health_status="ভালো (Good)",
        ndvi_score=0.65,
        completed_tasks="[]"
    )
    db.add(new_plot)
    db.commit()
    db.refresh(new_plot)
    return {"status": "success", "plot": new_plot}

@router.put("/{plot_id}")
def update_plot(plot_id: int, data: PlotUpdate, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="প্লট পাওয়া যায়নি")
    
    if data.name is not None: plot.name = data.name
    if data.crop_name is not None: plot.crop_name = data.crop_name
    if data.crop_variety is not None: plot.crop_variety = data.crop_variety
    if data.planting_date is not None: plot.planting_date = data.planting_date
    if data.area_value is not None: plot.area_value = data.area_value
    if data.area_unit is not None: plot.area_unit = data.area_unit
    if data.soil_type is not None: plot.soil_type = data.soil_type
    if data.irrigation_source is not None: plot.irrigation_source = data.irrigation_source
    if data.current_stage is not None: plot.current_stage = data.current_stage
    if data.health_status is not None: plot.health_status = data.health_status
    if data.ndvi_score is not None: plot.ndvi_score = data.ndvi_score
    if data.polygon_geojson is not None: plot.polygon_geojson = data.polygon_geojson
    if data.completed_tasks is not None: plot.completed_tasks = data.completed_tasks

    db.commit()
    db.refresh(plot)
    return {"status": "success", "plot": plot}

@router.delete("/{plot_id}")
def delete_plot(plot_id: int, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="প্লট পাওয়া যায়নি")
    db.delete(plot)
    db.commit()
    return {"status": "success", "message": "প্লট সফলভাবে মুছে ফেলা হয়েছে"}
