from fastapi import APIRouter, Query
from app.services.weather_service import WeatherService
from app.services.nasa_service import NasaService

router = APIRouter(prefix="/weather", tags=["Weather & Climatology"])

@router.get("/forecast")
async def get_forecast(
    lat: float = Query(24.7471, description="Latitude"),
    lon: float = Query(90.4203, description="Longitude"),
    location_name: str = Query("", description="Farmer Profile Location Name")
):
    """7-day high resolution weather forecast with unified spray advisory tailored to farmer profile location."""
    forecast = await WeatherService.get_forecast(lat, lon, location_name=location_name)
    return forecast

@router.get("/nasa-climatology")
async def get_nasa_climatology(lat: float = Query(24.7471, description="Latitude"), lon: float = Query(90.4203, description="Longitude")):
    """NASA POWER 20-year historical baseline for precipitation, temperature, and soil moisture."""
    climatology = await NasaService.get_climatology(lat, lon)
    return climatology

@router.get("/reverse-geocode")
async def reverse_geocode(lat: float = Query(..., description="Latitude"), lon: float = Query(..., description="Longitude")):
    """Reverse geocode GPS coordinates into Bangladesh administrative hierarchy."""
    return await WeatherService.reverse_geocode(lat, lon)

@router.get("/forward-geocode")
async def forward_geocode(
    query: str = Query("", description="Full address search query"),
    district: str = Query("", description="District name"),
    upazila: str = Query("", description="Upazila name"),
    union_name: str = Query("", description="Union / Pourashava / City Corp"),
    ward: str = Query("", description="Ward name or number"),
    village: str = Query("", description="Village / Area / Para / Sector")
):
    """Forward geocode an address into latitude and longitude coordinates."""
    return await WeatherService.forward_geocode(query, district, upazila, union_name, ward, village)

