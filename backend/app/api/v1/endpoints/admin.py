"""
Administration, Data Sources & Quality Assurance Endpoints
==========================================================
"""

import json
from pathlib import Path
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import Alert, AuditLog, DataSource, FloodEvent, Location
from app.services.ingestion_service import validate_and_ingest_rainfall_csv

router = APIRouter()


@router.get("/admin/sources", summary="List Connected Data Sources and Status")
def get_data_sources(db: Session = Depends(get_db)):
    sources = db.query(DataSource).all()
    if not sources:
        # Default registered data sources if not seeded yet
        return [
            {
                "id": "SRC-IMD",
                "name": "India Meteorological Department (IMD)",
                "provider": "IMD Regional Met Centre Chennai / AWS Network",
                "endpoint_url": "https://mausam.imd.gov.in/",
                "update_frequency_min": 60,
                "status": "HEALTHY",
                "last_sync_at": "2026-10-22T12:00:00Z",
                "last_status_code": 200,
            },
            {
                "id": "SRC-OPENMETEO",
                "name": "Open-Meteo Weather Nowcast API",
                "provider": "Open-Meteo European Weather Service",
                "endpoint_url": "https://api.open-meteo.com/v1/forecast",
                "update_frequency_min": 15,
                "status": "HEALTHY",
                "last_sync_at": "2026-10-22T13:20:00Z",
                "last_status_code": 200,
            },
            {
                "id": "SRC-TNSDMA",
                "name": "Tamil Nadu State Disaster Management Authority",
                "provider": "TNSDMA Incident Database",
                "endpoint_url": "https://tnsdma.tn.gov.in/",
                "update_frequency_min": 120,
                "status": "HEALTHY",
                "last_sync_at": "2026-10-22T10:00:00Z",
                "last_status_code": 200,
            },
            {
                "id": "SRC-CCMC",
                "name": "Coimbatore City Municipal Corporation (CCMC) Storm Drainage",
                "provider": "CCMC Engineering & Control Room",
                "endpoint_url": "https://coimbatorecorporation.gov.in/",
                "update_frequency_min": 30,
                "status": "HEALTHY",
                "last_sync_at": "2026-10-22T13:00:00Z",
                "last_status_code": 200,
            },
        ]
    return sources


@router.post("/admin/ingest", summary="Validate & Ingest Rainfall or Flood Dataset CSV")
async def ingest_csv(file: UploadFile = File(...)):
    """
    Validates CSV columns, checks values against physical thresholds,
    detects duplicate and missing entries, and generates a QA audit report.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported.")

    content = await file.read()
    report = validate_and_ingest_rainfall_csv(content, file.filename)
    return report


@router.get("/admin/audit", summary="Get System Audit Logs")
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return logs


@router.post("/admin/seed", summary="Seed Database with Coimbatore Stations & Verified Events")
def seed_database(db: Session = Depends(get_db)):
    """
    Seeds Coimbatore micro-catchments, verified historical flood incident records,
    and registered data sources.
    """
    # Check possible data directories robustly
    data_dir = None
    curr = Path(__file__).resolve()
    for parent in [curr.parents[3], curr.parents[4], curr.parents[5] if len(curr.parents) > 5 else curr.parent, Path.cwd(), Path.cwd().parent]:
        candidate = parent / "data"
        if (candidate / "coimbatore_stations.json").exists():
            data_dir = candidate
            break

    if not data_dir:
        data_dir = Path.cwd() / "data"

    stations_file = data_dir / "coimbatore_stations.json"
    floods_file = data_dir / "coimbatore_historical_floods.csv"

    seeded_stations = 0
    seeded_floods = 0

    # 1. Seed Stations
    if stations_file.exists():
        with open(stations_file, "r", encoding="utf-8") as f:
            stations_data = json.load(f)
            for s in stations_data:
                existing = db.query(Location).filter(Location.id == s["id"]).first()
                if not existing:
                    loc = Location(
                        id=s["id"],
                        name=s["name"],
                        ward=s.get("ward"),
                        latitude=s["latitude"],
                        longitude=s["longitude"],
                        elevation_m=s["elevation_m"],
                        slope_deg=s.get("slope_deg", 1.0),
                        drainage_capacity_index=s.get("drainage_capacity_index", 0.5),
                        impervious_ratio=s.get("impervious_ratio", 0.8),
                        risk_baseline=s.get("risk_baseline", "Moderate"),
                        description=s.get("description"),
                        is_active=True,
                    )
                    db.add(loc)
                    seeded_stations += 1
        db.commit()

    # 2. Seed Verified Flood Events
    if floods_file.exists():
        import csv
        with open(floods_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                existing = db.query(FloodEvent).filter(FloodEvent.id == row["incident_id"]).first()
                if not existing:
                    from datetime import datetime
                    try:
                        inc_dt = datetime.fromisoformat(row["incident_timestamp"].replace("Z", "+00:00"))
                    except Exception:
                        inc_dt = datetime.now()

                    ev = FloodEvent(
                        id=row["incident_id"],
                        event_name=row["event_name"],
                        incident_timestamp=inc_dt,
                        location_id=row.get("station_id"),
                        location_name=row["location_name"],
                        latitude=float(row["latitude"]),
                        longitude=float(row["longitude"]),
                        rainfall_1h_mm=float(row["rainfall_1h_mm"]) if row.get("rainfall_1h_mm") else None,
                        rainfall_3h_mm=float(row["rainfall_3h_mm"]) if row.get("rainfall_3h_mm") else None,
                        rainfall_24h_mm=float(row["rainfall_24h_mm"]) if row.get("rainfall_24h_mm") else None,
                        flood_depth_cm=float(row["flood_depth_cm"]) if row.get("flood_depth_cm") else None,
                        severity=row["severity"],
                        impact_summary=row["impact_summary"],
                        source=row["source"],
                        verification_status=row.get("verification_status", "Verified Official"),
                    )
                    db.add(ev)
                    seeded_floods += 1
        db.commit()

    # 3. Seed Default Alerts if empty
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    sample_alerts = [
        Alert(
            id="ALT-20261022-001",
            alert_code="CBE-WRN-CBE-01",
            severity="Warning",
            status="Active",
            location_id="CBE-01",
            location_name="Lanka Corner Underpass",
            title="Railway Underpass Ponding Warning",
            description="Heavy runoff accumulation detected in Lanka Corner railway subway. Automated pump activated.",
            reason="Precipitation rate 36.5 mm/h exceeds subway culvert drainage capacity of 22 mm/h.",
            source_trigger="Automated Nowcast ML Model",
            triggered_at=now - timedelta(minutes=45),
            expires_at=now + timedelta(hours=5),
            cooldown_until=now + timedelta(minutes=60),
        ),
        Alert(
            id="ALT-20261022-002",
            alert_code="CBE-ADV-CBE-02",
            severity="Advisory",
            status="Acknowledged",
            location_id="CBE-02",
            location_name="Ukkadam Periyakulam Catchment",
            title="Lake Surplus Weir Monitoring Advisory",
            description="Water level in Periyakulam feeder channel is approaching 80% capacity.",
            reason="Accumulated 24-hour rainfall upstream in Noyyal basin reached 68 mm.",
            source_trigger="Automated Hydrological Monitor",
            triggered_at=now - timedelta(hours=2),
            expires_at=now + timedelta(hours=4),
            acknowledged_at=now - timedelta(minutes=30),
            acknowledged_by="Executive Engineer (Water Resources)",
        ),
        Alert(
            id="ALT-20261026-003",
            alert_code="CBE-EMG-CBE-11",
            severity="Emergency",
            status="Active",
            location_id="CBE-11",
            location_name="Sivananda Colony Railway Underpass",
            title="Severe Railway Subway Inundation Flash Warning",
            description="Subway water depth reached 85cm. Traffic barricades deployed; motorized pumps running at 4500 LPM.",
            reason="Continuous rainfall intensity 52 mm/h with 90% catchment impervious runoff.",
            source_trigger="Automated IoT Water Level Sensor",
            triggered_at=now - timedelta(minutes=15),
            expires_at=now + timedelta(hours=6),
            cooldown_until=now + timedelta(minutes=45),
        ),
        Alert(
            id="ALT-20261026-004",
            alert_code="CBE-WCH-CBE-05",
            severity="Watch",
            status="Resolved",
            location_id="CBE-05",
            location_name="Singanallur Lake & Trichy Rd",
            title="Trichy Road Backflow Watch",
            description="Temporary water accumulation near arterial highway cleared by CCMC emergency teams.",
            reason="Slight lake backflow after 45mm rain event; drain desilting completed.",
            source_trigger="CCMC Stormwater Control Room",
            triggered_at=now - timedelta(hours=8),
            expires_at=now + timedelta(hours=1),
            acknowledged_at=now - timedelta(hours=7),
            acknowledged_by="Divisional Engineer (Highways)",
            resolved_at=now - timedelta(hours=1),
        ),
        Alert(
            id="ALT-20261026-005",
            alert_code="CBE-WRN-CBE-14",
            severity="Warning",
            status="Active",
            location_id="CBE-14",
            location_name="Sundarapuram / Kurichi Kulam Basin",
            title="Kurichi Lake Peripheral Sluice Inflow Warning",
            description="Upstream catchment runoff entering lake has increased by 140%. Ground-level sluices opened.",
            reason="3-hour rainfall 48.0mm in South Coimbatore belt.",
            source_trigger="Automated Nowcast ML Model",
            triggered_at=now - timedelta(minutes=30),
            expires_at=now + timedelta(hours=4),
            cooldown_until=now + timedelta(minutes=60),
        ),
    ]
    for a in sample_alerts:
        existing = db.query(Alert).filter(Alert.id == a.id).first()
        if not existing:
            db.add(a)
    db.commit()

    return {
        "success": True,
        "message": "Database seeded successfully",
        "stations_seeded": seeded_stations,
        "flood_events_seeded": seeded_floods,
    }
