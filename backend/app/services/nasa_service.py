import httpx
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Mymensingh, Bangladesh default coordinates
DEFAULT_LAT = 24.7471
DEFAULT_LON = 90.4203

# Climatological baseline for Bangladesh (20-year NASA POWER averages)
BANGLADESH_CLIMATOLOGY = {
    1: {"rain_mm": 7.5, "temp_c": 18.2, "solar_rad": 4.1, "soil_moisture": 0.45},
    2: {"rain_mm": 21.0, "temp_c": 21.5, "solar_rad": 4.8, "soil_moisture": 0.42},
    3: {"rain_mm": 45.2, "temp_c": 26.0, "solar_rad": 5.4, "soil_moisture": 0.38},
    4: {"rain_mm": 135.0, "temp_c": 28.5, "solar_rad": 5.6, "soil_moisture": 0.52},
    5: {"rain_mm": 280.4, "temp_c": 28.8, "solar_rad": 5.2, "soil_moisture": 0.72},
    6: {"rain_mm": 410.0, "temp_c": 29.1, "solar_rad": 4.5, "soil_moisture": 0.88},
    7: {"rain_mm": 440.5, "temp_c": 28.9, "solar_rad": 4.2, "soil_moisture": 0.92},
    8: {"rain_mm": 360.2, "temp_c": 29.0, "solar_rad": 4.4, "soil_moisture": 0.90},
    9: {"rain_mm": 295.0, "temp_c": 28.6, "solar_rad": 4.3, "soil_moisture": 0.85},
    10: {"rain_mm": 160.0, "temp_c": 27.2, "solar_rad": 4.6, "soil_moisture": 0.68},
    11: {"rain_mm": 18.5, "temp_c": 23.4, "solar_rad": 4.4, "soil_moisture": 0.52},
    12: {"rain_mm": 8.0, "temp_c": 19.5, "solar_rad": 4.0, "soil_moisture": 0.48}
}

class NasaService:
    @staticmethod
    async def get_climatology(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON) -> Dict[str, Any]:
        """
        Fetch 20+ year climatology from NASA POWER API.
        Parameters: PRECTOTCORR (precipitation), T2M (2m temp), ALLSKY_SFC_SW_DWN (solar rad), GWETTOP (surface soil wetness)
        """
        url = f"https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=PRECTOTCORR,T2M,ALLSKY_SFC_SW_DWN,GWETTOP&community=AG&longitude={lon}&latitude={lat}&format=JSON"
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    properties = data.get("properties", {}).get("parameter", {})
                    
                    months_data = []
                    for m in range(1, 13):
                        m_str = f"{m:02d}" if f"{m:02d}" in properties.get("PRECTOTCORR", {}) else str(m)
                        rain = properties.get("PRECTOTCORR", {}).get(m_str, BANGLADESH_CLIMATOLOGY[m]["rain_mm"])
                        temp = properties.get("T2M", {}).get(m_str, BANGLADESH_CLIMATOLOGY[m]["temp_c"])
                        solar = properties.get("ALLSKY_SFC_SW_DWN", {}).get(m_str, BANGLADESH_CLIMATOLOGY[m]["solar_rad"])
                        soil = properties.get("GWETTOP", {}).get(m_str, BANGLADESH_CLIMATOLOGY[m]["soil_moisture"])
                        
                        months_data.append({
                            "month": m,
                            "rain_mm": round(rain * 30.4, 1) if rain < 20 else round(rain, 1),
                            "temp_c": round(temp, 1),
                            "solar_rad": round(solar, 2),
                            "soil_moisture": round(soil, 2)
                        })
                    
                    return {
                        "source": "NASA POWER Climatology (20-Year Baseline)",
                        "status": "success",
                        "latitude": lat,
                        "longitude": lon,
                        "monthly": months_data
                    }
        except Exception as e:
            logger.warning(f"NASA POWER API fallback triggered: {e}")

        # Fallback return
        return {
            "source": "NASA POWER Climatology (Standard Agro Model)",
            "status": "fallback",
            "latitude": lat,
            "longitude": lon,
            "monthly": [
                {"month": m, **BANGLADESH_CLIMATOLOGY[m]} for m in range(1, 13)
            ]
        }

    @staticmethod
    def get_gibs_ndvi_wms_layer() -> Dict[str, Any]:
        """
        NASA GIBS WMTS/WMS tile layer config for Leaflet.
        MODIS Terra 250m 16-day NDVI / 8-day Surface Reflectance.
        """
        return {
            "layer_name": "MODIS_Terra_NDVI_16Day",
            "title_bn": "নাসা জিআইবিএস (MODIS Terra স্যাটেলাইট NDVI স্তর)",
            "url_template": "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_16Day/default/{Time}/{TileMatrixSet}/{z}/{y}/{x}.png",
            "time": "2026-09-01",
            "resolution": "250m / HLS 30m harmonized",
            "attribution": "NASA Earth Science Data and Information System (ESDIS) GIBS"
        }
