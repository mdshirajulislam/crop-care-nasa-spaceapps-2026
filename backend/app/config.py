from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Crop Care (কৃষি বন্ধু) - NASA Agro Assistant"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./crop_care.db")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    NASA_EARTHDATA_KEY: Optional[str] = os.getenv("NASA_EARTHDATA_KEY", "")
    NASA_FIRMS_MAP_KEY: Optional[str] = os.getenv("NASA_FIRMS_MAP_KEY", "")
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    NASA_POWER_BASE_URL: str = "https://power.larc.nasa.gov/api/temporal"

settings = Settings()
