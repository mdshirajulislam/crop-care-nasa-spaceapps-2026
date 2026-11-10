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
    if result.get("is_crop_leaf") is False:
        return result

    # Save record if valid diagnosis
    try:
        diag_record = DiseaseDiagnosis(
            crop_name=result.get("crop_name", "ফসল"),
            disease_name_bn=result.get("disease_name_bn", "রোগ"),
            disease_name_en=result.get("disease_name_en", "Disease"),
            confidence=result.get("confidence", 0.94),
            severity=result.get("severity", "মাঝারি"),
            symptoms_bn=result.get("symptoms_bn", ""),
            causes_bn=result.get("causes_bn", ""),
            organic_treatment_bn=result.get("treatment", {}).get("organic_home_remedy", ""),
            chemical_treatment_bn=result.get("treatment", {}).get("chemical_medicine", ""),
            dosage_per_bigha=result.get("treatment", {}).get("dosage_per_bigha", ""),
            safety_precautions_bn=result.get("treatment", {}).get("safety_guideline", ""),
            estimated_cost_bdt=result.get("treatment", {}).get("calculated_cost_for_land", {}).get("total_estimated_bdt", 350.0)
        )
        db.add(diag_record)
        db.commit()
        db.refresh(diag_record)
    except Exception:
        pass

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
