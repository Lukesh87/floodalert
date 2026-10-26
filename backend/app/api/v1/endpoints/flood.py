"""
Flood Risk Nowcasting, ML Prediction & Historical Events Endpoints
==================================================================
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.ml.predictor import is_model_available, predict_flood_risk
from app.models.entities import FloodEvent, FloodPrediction, Location
from app.schemas.flood import FloodEventResponse, FloodPredictionRequest, FloodPredictionResponse
from app.services.flood_service import get_city_nowcast_status
from app.services.weather_service import fetch_coimbatore_weather

router = APIRouter()


@router.get("/flood/events", response_model=List[FloodEventResponse], summary="List Verified Historical Flood Events")
def list_flood_events(
    severity: Optional[str] = Query(None, description="Filter by severity: Low, Moderate, High, Severe"),
    location_id: Optional[str] = Query(None, description="Filter by station ID"),
    search: Optional[str] = Query(None, description="Text search in event name or impact"),
    db: Session = Depends(get_db),
):
    query = db.query(FloodEvent)

    if severity:
        query = query.filter(FloodEvent.severity == severity)
    if location_id:
        query = query.filter(FloodEvent.location_id == location_id)
    if search:
        query = query.filter(
            (FloodEvent.event_name.ilike(f"%{search}%"))
            | (FloodEvent.impact_summary.ilike(f"%{search}%"))
            | (FloodEvent.location_name.ilike(f"%{search}%"))
        )

    events = query.order_by(FloodEvent.incident_timestamp.desc()).all()
    # Format timestamp to ISO string for schema validation
    results = []
    for ev in events:
        results.append(
            FloodEventResponse(
                id=ev.id,
                event_name=ev.event_name,
                incident_timestamp=ev.incident_timestamp.isoformat() if hasattr(ev.incident_timestamp, 'isoformat') else str(ev.incident_timestamp),
                location_id=ev.location_id,
                location_name=ev.location_name,
                latitude=ev.latitude,
                longitude=ev.longitude,
                rainfall_1h_mm=ev.rainfall_1h_mm,
                rainfall_3h_mm=ev.rainfall_3h_mm,
                rainfall_24h_mm=ev.rainfall_24h_mm,
                flood_depth_cm=ev.flood_depth_cm,
                severity=ev.severity,
                impact_summary=ev.impact_summary,
                source=ev.source,
                verification_status=ev.verification_status,
            )
        )
    return results


@router.get("/flood/risk", summary="Get Current Coimbatore Flood Risk Nowcast")
async def get_current_flood_risk(db: Session = Depends(get_db)):
    """
    Returns citywide nowcast risk level and individual micro-catchment stations.
    """
    weather = await fetch_coimbatore_weather()
    return get_city_nowcast_status(db, weather)


@router.post("/flood/predict", response_model=FloodPredictionResponse, summary="Predict Flood Risk (ML Inference)")
def predict_risk(
    req: FloodPredictionRequest,
    db: Session = Depends(get_db),
):
    """
    Takes user-supplied or station hydrological parameters and runs inference
    through the trained Random Forest model.
    """
    if not is_model_available():
        raise HTTPException(
            status_code=503,
            detail="Machine learning model is not loaded or trained. Please ensure artifacts are available.",
        )

    elev = req.elevation_m
    slope = req.slope_deg
    drainage = req.drainage_capacity_index
    soil_moist = req.soil_moisture_pct
    impervious = req.impervious_ratio
    loc_name = "Custom Evaluation Site"

    # If location_id is provided, auto-fill default terrain attributes if omitted
    if req.location_id:
        loc = db.query(Location).filter(Location.id == req.location_id).first()
        if loc:
            loc_name = loc.name
            if elev is None:
                elev = loc.elevation_m
            if slope is None:
                slope = loc.slope_deg
            if drainage is None:
                drainage = loc.drainage_capacity_index
            if impervious is None:
                impervious = loc.impervious_ratio

    # Defaults if still unprovided
    if elev is None:
        elev = 415.0
    if slope is None:
        slope = 1.2
    if drainage is None:
        drainage = 0.50
    if soil_moist is None:
        soil_moist = min(95.0, 40.0 + (req.rainfall_24h * 0.35))
    if impervious is None:
        impervious = 0.80

    features = {
        "rainfall_1h": req.rainfall_1h,
        "rainfall_3h": req.rainfall_3h,
        "rainfall_24h": req.rainfall_24h,
        "elevation_m": elev,
        "slope_deg": slope,
        "drainage_capacity_index": drainage,
        "soil_moisture_pct": soil_moist,
        "impervious_ratio": impervious,
    }

    try:
        prediction_result = predict_flood_risk(features)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    now = datetime.now(timezone.utc)

    # Persist prediction run in database
    if req.location_id:
        record = FloodPrediction(
            location_id=req.location_id,
            prediction_timestamp=now,
            forecast_horizon_hours=3,
            input_rainfall_1h=req.rainfall_1h,
            input_rainfall_3h=req.rainfall_3h,
            input_rainfall_24h=req.rainfall_24h,
            input_soil_moisture=soil_moist,
            risk_category=prediction_result["risk_category"],
            risk_level=prediction_result["risk_level"],
            flood_probability=prediction_result["flood_probability"],
            uncertainty_score=prediction_result["uncertainty_score"],
            uncertainty_level=prediction_result["uncertainty_level"],
            recommended_action=prediction_result["recommended_action"],
            model_version=prediction_result["model_version"],
        )
        db.add(record)
        db.commit()

    return FloodPredictionResponse(
        location_id=req.location_id,
        location_name=loc_name,
        prediction_timestamp=now.isoformat(),
        forecast_horizon_hours=3,
        risk_category=prediction_result["risk_category"],
        risk_level=prediction_result["risk_level"],
        flood_probability=prediction_result["flood_probability"],
        uncertainty_score=prediction_result["uncertainty_score"],
        uncertainty_level=prediction_result["uncertainty_level"],
        probabilities=prediction_result["probabilities"],
        top_contributing_factors=prediction_result["top_contributing_factors"],
        recommended_action=prediction_result["recommended_action"],
        model_version=prediction_result["model_version"],
        model_type=prediction_result["model_type"],
        input_summary=features,
    )
