from fastapi import APIRouter, Query, Body, Depends
from typing import Optional
from app.services.nasa_agro_service import NasaAgroService
from pydantic import BaseModel

router = APIRouter(prefix="/nasa-features", tags=["NASA Advanced Agro Intelligence"])

class InsuranceRequest(BaseModel):
    farmer_name: Optional[str] = "মোঃ সিরাজুল ইসলাম"
    plot_name: Optional[str] = "পূর্বের মাঠ (প্লট ১)"
    crop_name: Optional[str] = "আমন ধান"
    land_bigha: Optional[float] = 3.5
    hazard_type: Optional[str] = "excess_rain"

class HarvestCalcRequest(BaseModel):
    crop_maturity_pct: Optional[int] = 80
    land_bigha: Optional[float] = 3.5
    crop_name: Optional[str] = "বোরো ধান"
    market_price_per_maund: Optional[float] = 1150.0

@router.post("/emergency-harvest-calculator")
def get_emergency_harvest_analysis(req: HarvestCalcRequest):
    """Calculates Net Financial Salvage vs Potential Loss from Flood/Hailstorm (BRRI Model)."""
    return NasaAgroService.calculate_emergency_harvest(
        crop_maturity_pct=req.crop_maturity_pct or 80,
        land_bigha=req.land_bigha or 3.5,
        crop_name=req.crop_name or "বোরো ধান",
        market_price_per_maund=req.market_price_per_maund or 1150.0
    )

@router.get("/irrigation-advisor")
async def get_irrigation_advisor(
    crop_type: str = Query("aman_rice", description="Crop type"),
    land_bigha: float = Query(3.5, description="Land area in Bigha"),
    lat: float = Query(24.7471, description="Latitude"),
    lon: float = Query(90.4203, description="Longitude")
):
    """NASA SMAP Root-Zone Soil Moisture & Diesel Saving Irrigation Scheduler."""
    return await NasaAgroService.calculate_smart_irrigation(crop_type, land_bigha, lat, lon)

@router.get("/flash-flood-warning")
async def get_flash_flood_warning(region: str = Query("haor", description="Haor or river basin")):
    """NASA GPM / IMERG 7-day upstream rainfall runoff & early harvest warning."""
    return await NasaAgroService.get_haor_flash_flood_alert(region)

@router.post("/insurance-certificate")
async def create_insurance_certificate(req: InsuranceRequest):
    """NASA Parametric Climate Loss Certificate for Bank / Insurance Claims."""
    return await NasaAgroService.generate_insurance_certificate(
        farmer_name=req.farmer_name,
        plot_name=req.plot_name,
        crop_name=req.crop_name,
        land_bigha=req.land_bigha,
        hazard_type=req.hazard_type
    )

@router.get("/community-pest-radar")
def get_pest_radar():
    """Crowdsourced Pest & Disease Outbreak Live Community Radar."""
    return NasaAgroService.get_community_pest_reports()

@router.get("/thermal-stress")
async def get_canopy_thermal_stress(
    crop_type: str = Query("aman_rice", description="Crop type"),
    land_bigha: float = Query(3.5, description="Land area in Bigha"),
    lat: float = Query(24.7471, description="Latitude"),
    lon: float = Query(90.4203, description="Longitude")
):
    """NASA ECOSTRESS (ISS Thermal Radiometer) Canopy Temperature, Transpiration & Hidden Thirst Detector."""
    return await NasaAgroService.calculate_canopy_thermal_stress(crop_type, lat, lon, land_bigha)
