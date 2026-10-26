"""
Flood Risk Nowcasting & Map Aggregation Service
===============================================
Computes near real-time flood risk across all Coimbatore micro-catchments,
integrating live weather observations, station terrain indices, and ML inference.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List
from sqlalchemy.orm import Session

from app.ml.predictor import is_model_available, predict_flood_risk
from app.models.entities import Location, RainfallObservation
from app.services.alert_service import AlertService


def get_city_nowcast_status(db: Session, weather_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates current risk for all active Coimbatore stations.
    """
    stations = db.query(Location).filter(Location.is_active == True).all()
    precip_1h = float(weather_data.get("precipitation_mm", 0.0))
    rain_mm = float(weather_data.get("rain_mm", precip_1h))

    results = []
    max_risk_level = 0
    max_risk_category = "Low"
    total_stations = len(stations)
    high_risk_count = 0

    model_ready = is_model_available()

    for st in stations:
        # Micro-catchment local rainfall variation
        # Low-lying stations near Noyyal/Lakes receive accumulated runoff
        local_multiplier = 1.0
        if st.id in ["CBE-01", "CBE-02"]: # Lanka corner / Ukkadam
            local_multiplier = 1.25
        elif st.id in ["CBE-05", "CBE-07"]: # Singanallur / Ramanathapuram
            local_multiplier = 1.15

        st_rain_1h = round(precip_1h * local_multiplier, 2)
        st_rain_3h = round(st_rain_1h * 2.2, 2)
        st_rain_24h = round(st_rain_3h * 2.8 + 5.0, 2)

        if model_ready:
            features = {
                "rainfall_1h": st_rain_1h,
                "rainfall_3h": st_rain_3h,
                "rainfall_24h": st_rain_24h,
                "elevation_m": float(st.elevation_m),
                "slope_deg": float(st.slope_deg),
                "drainage_capacity_index": float(st.drainage_capacity_index),
                "soil_moisture_pct": min(95.0, 45.0 + (st_rain_24h * 0.4)),
                "impervious_ratio": float(st.impervious_ratio),
            }
            pred = predict_flood_risk(features)
            risk_cat = pred["risk_category"]
            risk_lvl = pred["risk_level"]
            flood_prob = pred["flood_probability"]
            uncertainty = pred["uncertainty_score"]
        else:
            # Deterministic hydrological threshold baseline if ML model file is somehow unmounted
            if st_rain_1h > 45 or st_rain_24h > 115:
                risk_cat, risk_lvl, flood_prob = "Severe", 3, 0.90
            elif st_rain_1h > 25 or st_rain_24h > 64:
                risk_cat, risk_lvl, flood_prob = "High", 2, 0.72
            elif st_rain_1h > 10 or st_rain_24h > 35:
                risk_cat, risk_lvl, flood_prob = "Moderate", 1, 0.40
            else:
                risk_cat, risk_lvl, flood_prob = "Low", 0, 0.12
            uncertainty = 0.25

        if risk_lvl > max_risk_level:
            max_risk_level = risk_lvl
            max_risk_category = risk_cat

        if risk_lvl >= 2:
            high_risk_count += 1
            # Check if alert should be raised for high or severe risk
            if risk_cat in ["High", "Severe"]:
                AlertService.create_alert(
                    db=db,
                    location_id=st.id,
                    location_name=st.name,
                    severity="Warning" if risk_cat == "High" else "Emergency",
                    title=f"Elevated Flood Risk at {st.name}",
                    description=f"Nowcast model indicates {risk_cat} flood probability ({flood_prob*100:.1f}%) due to high runoff accumulation.",
                    reason=f"Rainfall intensity: {st_rain_1h} mm/h, Low elevation: {st.elevation_m}m, High imperviousness: {st.impervious_ratio * 100:.0f}%.",
                )

        results.append({
            "location_id": st.id,
            "location_name": st.name,
            "ward": st.ward,
            "latitude": st.latitude,
            "longitude": st.longitude,
            "elevation_m": st.elevation_m,
            "slope_deg": st.slope_deg,
            "drainage_capacity_index": st.drainage_capacity_index,
            "impervious_ratio": st.impervious_ratio,
            "risk_baseline": st.risk_baseline,
            "risk_category": risk_cat,
            "risk_level": risk_lvl,
            "flood_probability": flood_prob,
            "uncertainty_score": uncertainty,
            "rainfall_1h_mm": st_rain_1h,
            "rainfall_3h_mm": st_rain_3h,
            "rainfall_24h_mm": st_rain_24h,
            "status": "CRITICAL" if risk_lvl == 3 else "WARNING" if risk_lvl == 2 else "WATCH" if risk_lvl == 1 else "NORMAL",
            "last_updated": datetime.now(timezone.utc).isoformat(),
        })

    return {
        "city": "Coimbatore",
        "state": "Tamil Nadu",
        "country": "India",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "overall_risk_category": max_risk_category,
        "overall_risk_level": max_risk_level,
        "total_stations_monitored": total_stations,
        "stations_at_risk": high_risk_count,
        "model_available": model_ready,
        "stations": results,
    }
