from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    village: Optional[str] = None
    upazila: Optional[str] = None
    district: Optional[str] = None
    language: Optional[str] = None
    preferred_land_unit: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

@router.post("/send-otp")
def send_otp(req: OTPRequest):
    # Test mode fake OTP for Bangladeshi farmers
    return {
        "status": "success",
        "message_bn": f"{req.phone} নম্বরে ওটিপি পাঠানো হয়েছে (টেস্ট ওটিপি: 1234)",
        "test_otp": "1234"
    }

@router.post("/verify-otp")
def verify_otp(req: OTPVerify, db: Session = Depends(get_db)):
    if req.otp not in ["1234", "9999", "5678"]:
        raise HTTPException(status_code=400, detail="ভুল ওটিপি কোড")
    
    user = db.query(User).filter(User.phone == req.phone).first()
    if not user:
        user = User(
            name="মোঃ সিরাজুল ইসলাম",
            phone=req.phone,
            village="চর নিলক্ষীয়া",
            upazila="ময়মনসিংহ সদর",
            district="ময়মনসিংহ",
            language="bn",
            preferred_land_unit="bigha",
            lat=24.7471,
            lon=90.4203
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "status": "success",
        "token": "demo-jwt-token-bangladesh-farmer",
        "user": {
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "village": user.village,
            "upazila": user.upazila,
            "district": user.district,
            "language": user.language,
            "preferred_land_unit": user.preferred_land_unit,
            "lat": user.lat,
            "lon": user.lon
        }
    }

@router.get("/profile")
def get_profile(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User()
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@router.put("/profile")
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User()
        db.add(user)
    
    if data.name: user.name = data.name
    if data.village: user.village = data.village
    if data.upazila: user.upazila = data.upazila
    if data.district: user.district = data.district
    if data.language: user.language = data.language
    if data.preferred_land_unit: user.preferred_land_unit = data.preferred_land_unit
    if data.lat is not None: user.lat = data.lat
    if data.lon is not None: user.lon = data.lon
    
    db.commit()
    db.refresh(user)
    return {"status": "success", "user": user}
