from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, plots, weather, planting, disease, diary, chat, satellite, nasa_features

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Bangladeshi Farmer Agro-Intelligence PWA powered by NASA Earth Science Data, Open-Meteo & AI Vision",
    version="1.0.0"
)

# CORS Middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(plots.router, prefix="/api/v1")
app.include_router(weather.router, prefix="/api/v1")
app.include_router(planting.router, prefix="/api/v1")
app.include_router(disease.router, prefix="/api/v1")
app.include_router(diary.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(satellite.router, prefix="/api/v1")
app.include_router(nasa_features.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "app": "Crop Care (কৃষি বন্ধু)",
        "version": "1.0.0",
        "description": "NASA Space Apps Challenge 2026 - Production Ready Bangladeshi Farmer Application",
        "status": "online",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
