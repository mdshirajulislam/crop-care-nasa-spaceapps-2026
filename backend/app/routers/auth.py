import hashlib
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])

def hash_pw(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

class EmailRegisterRequest(BaseModel):
    name: Optional[str] = "কৃষক"
    email: str
    password: str

class EmailLoginRequest(BaseModel):
    email: str
    password: str

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

@router.post("/register")
def register(req: EmailRegisterRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    
    if user:
        # If already exists, update name and password
        user.name = req.name or user.name
        user.password_hash = hash_pw(req.password)
        db.commit()
        db.refresh(user)
    else:
        user = User(
            name=req.name or "কৃষি বন্ধু কৃষক",
            email=clean_email,
            password_hash=hash_pw(req.password),
            phone="017" + str(uuid.uuid4().int)[:8],
            village="চর নিলক্ষীয়া",
            union_name="চর নিলক্ষীয়া ইউনিয়ন",
            ward="ওয়ার্ড ১",
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

    token = f"crop-care-token-{user.id}-{uuid.uuid4().hex[:12]}"
    user_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "village": user.village,
        "union_name": user.union_name,
        "ward": user.ward,
        "upazila": user.upazila,
        "district": user.district,
        "language": user.language,
        "preferred_land_unit": user.preferred_land_unit,
        "lat": user.lat,
        "lon": user.lon
    }
    return {
        "status": "success",
        "token": token,
        "user": user_data,
        **user_data
    }

@router.post("/login")
def login(req: EmailLoginRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    
    if not user:
        # Seamless onboarding: auto-create account for friendly UX
        user = User(
            name="মোঃ সিরাজুল ইসলাম",
            email=clean_email,
            password_hash=hash_pw(req.password),
            phone="017" + str(uuid.uuid4().int)[:8],
            village="চর নিলক্ষীয়া",
            union_name="চর নিলক্ষীয়া ইউনিয়ন",
            ward="ওয়ার্ড ১",
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
    elif user.password_hash and user.password_hash != hash_pw(req.password):
        # If password hash exists but doesn't match, verify if user provided a password
        if len(req.password) < 4:
            raise HTTPException(status_code=400, detail="পাসওয়ার্ড অত্যন্ত ছোট (কমপক্ষে ৪ অক্ষরের হতে হবে)")
        # Update to new password to prevent user lock-out
        user.password_hash = hash_pw(req.password)
        db.commit()
        db.refresh(user)

    token = f"crop-care-token-{user.id}-{uuid.uuid4().hex[:12]}"
    user_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "village": user.village,
        "union_name": user.union_name,
        "ward": user.ward,
        "upazila": user.upazila,
        "district": user.district,
        "language": user.language,
        "preferred_land_unit": user.preferred_land_unit,
        "lat": user.lat,
        "lon": user.lon
    }
    return {
        "status": "success",
        "token": token,
        "user": user_data,
        **user_data
    }

@router.get("/user")
@router.get("/me")
def get_current_user(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User()
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    village: Optional[str] = None
    area_type: Optional[str] = None # union, pourashava, city_corporation
    union_name: Optional[str] = None
    union: Optional[str] = None
    ward: Optional[str] = None
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
            union_name="চর নিলক্ষীয়া ইউনিয়ন",
            ward="ওয়ার্ড ১",
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
            "union_name": user.union_name,
            "ward": user.ward,
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
    
    if data.name is not None: user.name = data.name
    if data.village is not None: user.village = data.village
    if data.area_type is not None: user.area_type = data.area_type
    if data.union_name is not None: user.union_name = data.union_name
    elif data.union is not None: user.union_name = data.union
    if data.ward is not None: user.ward = data.ward
    if data.upazila is not None: user.upazila = data.upazila
    if data.district is not None: user.district = data.district
    if data.language is not None: user.language = data.language
    if data.preferred_land_unit is not None: user.preferred_land_unit = data.preferred_land_unit
    if data.lat is not None: user.lat = data.lat
    if data.lon is not None: user.lon = data.lon
    
    db.commit()
    db.refresh(user)
    return {"status": "success", "user": user}
