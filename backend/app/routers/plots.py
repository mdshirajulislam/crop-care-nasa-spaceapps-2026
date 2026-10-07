from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Plot, User
from pydantic import BaseModel
from typing import Optional, List

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
            ndvi_score=0.68
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

@router.post("/")
def create_plot(data: PlotCreate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    user_id = user.id if user else 1

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
        current_stage="চারা রোপণ পর্যায়",
        health_status="ভালো (Good)",
        ndvi_score=0.65
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
