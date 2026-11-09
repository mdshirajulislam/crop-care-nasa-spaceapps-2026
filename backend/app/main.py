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
