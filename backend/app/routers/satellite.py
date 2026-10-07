from fastapi import APIRouter
from app.services.nasa_service import NasaService

router = APIRouter(prefix="/satellite", tags=["Satellite NDVI & Earth Observation"])

@router.get("/layers")
def get_satellite_layers():
    return {
        "gibs_ndvi": NasaService.get_gibs_ndvi_wms_layer(),
        "open_street_map": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "google_satellite": "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
        "ndvi_legend": [
            {"range": "0.0 - 0.2", "color": "#d73027", "label_bn": "খুব দুর্বল / অনাবাদী জমি / জলাশয়"},
            {"range": "0.2 - 0.4", "color": "#fee08b", "label_bn": "মাঝারি স্বাস্থ্য / কম বৃদ্ধি"},
            {"range": "0.4 - 0.7", "color": "#a6d96a", "label_bn": "উত্তম স্বাস্থ্য / সতেজ ফসল"},
            {"range": "0.7 - 1.0", "color": "#1a9850", "label_bn": "চমৎকার স্বাস্থ্য / গাঢ় সবুজ ফসল"}
        ]
    }

@router.get("/ndvi-timeseries")
def get_ndvi_timeseries():
    """Mock/historical NDVI vegetation health timeseries for Mymensingh farm."""
    return [
        {"date": "২০২৬-০৬-১৫", "ndvi": 0.28, "stage_bn": "জমি প্রস্তুত ও বীজতলা"},
        {"date": "২০২৬-০৭-০১", "ndvi": 0.35, "stage_bn": "রোপণ শুরু"},
        {"date": "২০২৬-০৭-২০", "ndvi": 0.48, "stage_bn": "চারা প্রতিষ্ঠা"},
        {"date": "২০২৬-০৮-১৫", "ndvi": 0.65, "stage_bn": "কুশি গজানো"},
        {"date": "২০২৬-০৯-১০", "ndvi": 0.78, "stage_bn": "সর্বোচ্চ সবুজ বৃদ্ধি (থোর)"},
        {"date": "২০২৬-১০-০১", "ndvi": 0.72, "stage_bn": "শীষ বের হওয়া ও ফুল ফোটা"},
        {"date": "২০২৬-১০-১৫", "ndvi": 0.68, "stage_bn": "বর্তমান স্বাস্থ্য (সতেজ)"}
    ]
