"""
Health & Operational System Check Endpoint
==========================================
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.ml.predictor import is_model_available

router = APIRouter()


@router.get("/health", summary="System Health Status")
def health_check(db: Session = Depends(get_db)):
    """
    Returns system health, database connection status, ML model availability,
    and target city coordinates.
    """
    db_status = "HEALTHY"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"ERROR: {str(e)}"

    ml_ready = is_model_available()

    return {
        "status": "UP" if db_status == "HEALTHY" else "DEGRADED",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
        "ml_model_loaded": ml_ready,
        "monitored_region": {
            "city": "Coimbatore",
            "state": "Tamil Nadu",
            "country": "India",
            "coordinates": {
                "latitude": settings.DEFAULT_LATITUDE,
                "longitude": settings.DEFAULT_LONGITUDE,
            },
        },
    }
