from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import DiseaseDiagnosis, OutbreakAlert
from app.services.disease_service import DiseaseDiagnosisService
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/disease", tags=["Disease Diagnosis & Medicine Guide"])

class DiagnosisRequest(BaseModel):
    image_base64: Optional[str] = None
    crop_hint: Optional[str] = None
    disease_id: Optional[str] = None
    land_area_bigha: Optional[float] = 3.5

@router.post("/diagnose")
async def diagnose_crop(req: DiagnosisRequest, db: Session = Depends(get_db)):
    result = await DiseaseDiagnosisService.diagnose_crop_image(
        image_base64=req.image_base64,
        crop_hint=req.crop_hint,
        disease_id=req.disease_id,
        land_area_bigha=req.land_area_bigha or 3.5
    )
    # Save record
    diag_record = DiseaseDiagnosis(
        crop_name=result["crop_name"],
        disease_name_bn=result["disease_name_bn"],
        disease_name_en=result["disease_name_en"],
        confidence=result["confidence"],
        severity=result["severity"],
        symptoms_bn=result["symptoms_bn"],
        causes_bn=result["causes_bn"],
        organic_treatment_bn=result["treatment"]["organic_home_remedy"],
        chemical_treatment_bn=result["treatment"]["chemical_medicine"],
        dosage_per_bigha=result["treatment"]["dosage_per_bigha"],
        safety_precautions_bn=result["treatment"]["safety_guideline"],
        estimated_cost_bdt=result["treatment"]["calculated_cost_for_land"]["total_estimated_bdt"]
    )
    db.add(diag_record)
    db.commit()
    db.refresh(diag_record)

    return result

@router.get("/library")
def get_medicine_library():
    return DiseaseDiagnosisService.load_disease_db()

@router.get("/outbreaks")
def get_outbreak_alerts(db: Session = Depends(get_db)):
    alerts = db.query(OutbreakAlert).all()
    if not alerts:
        demo_alert = OutbreakAlert(
            district="ময়মনসিংহ",
            upazila="ময়মনসিংহ সদর",
            crop="আমন ধান",
            disease_name="ধানের ব্লাস্ট রোগ (Rice Blast)",
            alert_level="সতর্কতা (High Alert)",
            report_count=14,
            message_bn="আপনার উপজেলায় (ময়মনসিংহ সদর) বিগত ৩ দিনে ১৪ জন কৃষক ধানের ব্লাস্ট রোগের রিপোর্ট করেছেন। স্যাঁতসেঁতে আবহাওয়ার কারণে আপনার জমিতেও আগাম সতর্কতা অবলম্বন করুন।",
            date="2026-10-06"
        )
        db.add(demo_alert)
        db.commit()
        db.refresh(demo_alert)
        alerts = [demo_alert]
    return alerts
