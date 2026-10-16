from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routes.alerts import router as alerts_router
from app.routes.auth import router as auth_router
from app.routes.dashboard import router as dashboard_router
from app.routes.locations import router as locations_router
from app.routes.predictions import router as predictions_router
from app.routes.weather import router as weather_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Urban Flood Nowcasting & Early Warning System API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [
    auth_router,
    weather_router,
    locations_router,
    predictions_router,
    alerts_router,
    dashboard_router,
]:
    app.include_router(router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    from app.database import SessionLocal
    from app.services.demo_service import seed_database
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME}
