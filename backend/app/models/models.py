from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="মোঃ সিরাজুল ইসলাম")
    phone = Column(String(20), unique=True, index=True, default="01712345678")
    village = Column(String(100), default="চর নিলক্ষীয়া")
    upazila = Column(String(100), default="ময়মনসিংহ সদর")
    district = Column(String(100), default="ময়মনসিংহ")
    language = Column(String(10), default="bn") # bn or en
    preferred_land_unit = Column(String(20), default="bigha") # bigha, decimal, katha, acre
    lat = Column(Float, default=24.7471)
    lon = Column(Float, default=90.4203)
    created_at = Column(DateTime, default=datetime.utcnow)

    plots = relationship("Plot", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("FarmActivity", back_populates="user")
    expenses = relationship("Expense", back_populates="user")

class Plot(Base):
    __tablename__ = "plots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100), default="প্লট ১ - পূর্বের মাঠ")
    crop_name = Column(String(100), default="আমন ধান (Aman Rice)")
    crop_variety = Column(String(100), default="ব্রি ধান ৪৯ (BRRI Dhan 49)")
    planting_date = Column(String(50), default="2026-07-20")
    expected_harvest_date = Column(String(50), default="2026-11-25")
    area_value = Column(Float, default=3.5) # e.g. 3.5
    area_unit = Column(String(20), default="bigha") # bigha (33 decimal), decimal, katha, acre
    soil_type = Column(String(50), default="দোআঁশ মাটি (Loamy)") # dosh, bele, etel
    irrigation_source = Column(String(50), default="গভীর নলকূপ (Deep Tubewell)")
    polygon_geojson = Column(Text, nullable=True) # GeoJSON string of the boundary
    current_stage = Column(String(50), default="কুশি গজানো পর্যায় (Tillering Stage)")
    health_status = Column(String(50), default="ভালো (Good)")
    ndvi_score = Column(Float, default=0.68)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="plots")
    activities = relationship("FarmActivity", back_populates="plot", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="plot", cascade="all, delete-orphan")
    harvests = relationship("HarvestIncome", back_populates="plot", cascade="all, delete-orphan")

class FarmActivity(Base):
    __tablename__ = "farm_activities"

    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    activity_type = Column(String(50)) # রোপণ, সার প্রয়োগ, কীটনাশক, সেচ, নিড়ানি, কর্তন
    date = Column(String(50), default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    details = Column(Text) # সার/ওষুধের নাম, প্রয়োগের মাত্রা
    cost = Column(Float, default=0.0) # BDT
    worker_count = Column(Integer, default=0)
    photo_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    plot = relationship("Plot", back_populates="activities")
    user = relationship("User", back_populates="activities")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String(50)) # বীজ (Seed), সার (Fertilizer), কীটনাশক (Pesticide), শ্রমিক (Labor), সেচ (Irrigation), যন্ত্র (Machinery), অন্যান্য (Other)
    amount = Column(Float, default=0.0) # BDT
    date = Column(String(50))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    plot = relationship("Plot", back_populates="expenses")
    user = relationship("User", back_populates="expenses")

class HarvestIncome(Base):
    __tablename__ = "harvest_incomes"

    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    crop_yield_kg = Column(Float, default=0.0)
    total_sale_amount = Column(Float, default=0.0)
    sale_price_per_kg = Column(Float, default=0.0)
    date = Column(String(50))
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    plot = relationship("Plot", back_populates="harvests")

class DiseaseDiagnosis(Base):
    __tablename__ = "disease_diagnoses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, default=1)
    plot_id = Column(Integer, nullable=True)
    crop_name = Column(String(100))
    disease_name_bn = Column(String(150))
    disease_name_en = Column(String(150))
    confidence = Column(Float, default=0.92)
    severity = Column(String(50), default="মাঝারি (Moderate)")
    symptoms_bn = Column(Text)
    causes_bn = Column(Text)
    organic_treatment_bn = Column(Text)
    chemical_treatment_bn = Column(Text)
    dosage_per_bigha = Column(String(200))
    safety_precautions_bn = Column(Text)
    estimated_cost_bdt = Column(Float, default=450.0)
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class OutbreakAlert(Base):
    __tablename__ = "outbreak_alerts"

    id = Column(Integer, primary_key=True, index=True)
    district = Column(String(100), default="ময়মনসিংহ")
    upazila = Column(String(100), default="ময়মনসিংহ সদর")
    crop = Column(String(100), default="আমন ধান")
    disease_name = Column(String(150), default="ধানের ব্লাস্ট রোগ (Rice Blast)")
    alert_level = Column(String(50), default="সতর্কতা (High Alert)")
    report_count = Column(Integer, default=14)
    message_bn = Column(Text)
    date = Column(String(50))
