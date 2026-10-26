"""
Urban Flood Nowcasting System - FastAPI Backend
===============================================
Main application entry point, CORS middleware, database lifecycle,
and OpenAPI route registration.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.api.v1.endpoints.admin import seed_database
from app.core.config import settings
from app.db.session import Base, SessionLocal, engine
from app.models.entities import Location


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database schema exists
    Base.metadata.create_all(bind=engine)

    # Auto-seed initial stations & events if database is fresh
    db = SessionLocal()
    try:
        station_count = db.query(Location).count()
        if station_count == 0:
            print("Fresh database detected. Auto-seeding Coimbatore hydrological dataset...")
            seed_database(db)
            print("Auto-seeding complete.")
    finally:
        db.close()

    yield
    # Shutdown logic (if any)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "AI-Powered Urban Flood Nowcasting and Early Warning Platform for Coimbatore, Tamil Nadu, India. "
        "Provides real-time precipitation monitoring, micro-catchment terrain analysis, "
        "Random Forest flood probability predictions, and alert management."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "region": "Coimbatore, Tamil Nadu, India",
        "documentation": f"{settings.API_V1_STR}/docs",
        "api_v1": settings.API_V1_STR,
    }
