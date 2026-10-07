from fastapi import APIRouter, Query
from app.services.weather_service import WeatherService
from app.services.nasa_service import NasaService

router = APIRouter(prefix="/weather", tags=["Weather & Climatology"])

@router.get("/forecast")
async def get_forecast(lat: float = Query(24.7471, description="Latitude"), lon: float = Query(90.4203, description="Longitude")):
    """7-day high resolution weather forecast with unified spray advisory and correct Bengali days."""
    forecast = await WeatherService.get_forecast(lat, lon)
    return forecast

@router.get("/nasa-climatology")
async def get_nasa_climatology(lat: float = Query(24.7471, description="Latitude"), lon: float = Query(90.4203, description="Longitude")):
    """NASA POWER 20-year historical baseline for precipitation, temperature, and soil moisture."""
    climatology = await NasaService.get_climatology(lat, lon)
    return climatology
