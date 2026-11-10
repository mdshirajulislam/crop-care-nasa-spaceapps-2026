from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, plots, weather, planting, disease, diary, chat, satellite, nasa_features

# Initialize DB tables
Base.metadata.create_all(bind=engine)

# Auto-migrate SQLite columns if table already existed
try:
    from sqlalchemy import text
    with engine.connect() as conn:
        for col_name, col_type in [
            ("email", "VARCHAR(120)"),
            ("password_hash", "VARCHAR(255)")
        ]:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                conn.commit()
            except Exception:
                pass
except Exception:
    pass

# Auto-seed if database is fresh
try:
    from app.database import SessionLocal
    from app.models.models import User
    _db = SessionLocal()
    if not _db.query(User).first():
        try:
            from seed_data import seed_database
            seed_database()
        except Exception:
            pass
    _db.close()
except Exception:
    pass

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

# Register all Routers under both /api/v1 and /api (for backward compatibility)
for pfx in ["/api/v1", "/api"]:
    app.include_router(auth.router, prefix=pfx)
    app.include_router(plots.router, prefix=pfx)
    app.include_router(weather.router, prefix=pfx)
    app.include_router(planting.router, prefix=pfx)
    app.include_router(disease.router, prefix=pfx)
    app.include_router(diary.router, prefix=pfx)
    app.include_router(chat.router, prefix=pfx)
    app.include_router(satellite.router, prefix=pfx)
    app.include_router(nasa_features.router, prefix=pfx)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import HTTPException

# Check for static directory (built frontend bundle)
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
if not os.path.exists(STATIC_DIR):
    STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "static"))

if os.path.exists(STATIC_DIR):
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    def serve_root():
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {
            "app": "Crop Care (কৃষি বন্ধু)",
            "version": "1.0.0",
            "status": "online"
        }

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        # Don't intercept API or docs routes
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        
        raise HTTPException(status_code=404, detail="File Not Found")
else:
    @app.get("/")
    def root():
        return {
            "app": "Crop Care (কৃষি বন্ধু)",
            "version": "1.0.0",
            "description": "NASA Space Apps Challenge 2026 - Production Ready Bangladeshi Farmer Application",
            "status": "online",
            "docs_url": "/docs"
        }

@app.on_event("startup")
async def startup_keep_alive():
    import asyncio
    async def _ping_loop():
        await asyncio.sleep(60) # Wait 1 min after startup
        import urllib.request
        while True:
            try:
                req = urllib.request.Request(
                    "https://crop-care-nasa-spaceapps-2026.onrender.com/api/v1/weather/forecast?lat=24.7471&lon=90.4203",
                    headers={"User-Agent": "CropCare-KeepAlive/1.0"}
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    pass
            except Exception:
                pass
            await asyncio.sleep(600) # Ping every 10 minutes
    
    asyncio.create_task(_ping_loop())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
