from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Alert, Location
from app.schemas.schemas import AlertCreate, AlertOut
from app.routes.auth import get_admin_user, get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertOut])
def get_alerts(
    status_filter: str = None,
    severity_filter: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Alert).join(Location)
    if status_filter:
        query = query.filter(Alert.status == status_filter.upper())
    if severity_filter:
        query = query.filter(Alert.severity == severity_filter.upper())
        
    alerts = query.order_by(Alert.created_at.desc()).all()
    results = []
    for a in alerts:
        results.append({
            "id": a.id,
            "location_id": a.location_id,
            "location_name": a.location.name if a.location else "Unknown Location",
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "recommendation": a.recommendation,
            "status": a.status,
            "created_at": a.created_at
        })
    return results

@router.post("", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
def create_manual_alert(
    alert_in: AlertCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    loc = db.query(Location).filter(Location.id == alert_in.location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found.")
    
    alert = Alert(
        location_id=alert_in.location_id,
        severity=alert_in.severity.upper(),
        title=alert_in.title,
        message=alert_in.message,
        recommendation=alert_in.recommendation,
        status="ACTIVE"
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    return {
        "id": alert.id,
        "location_id": alert.location_id,
        "location_name": loc.name,
        "severity": alert.severity,
        "title": alert.title,
        "message": alert.message,
        "recommendation": alert.recommendation,
        "status": alert.status,
        "created_at": alert.created_at
    }

@router.put("/{alert_id}/read", response_model=AlertOut)
def mark_alert_read(
    alert_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    
    alert.status = "READ"
    db.commit()
    db.refresh(alert)
    return {
        "id": alert.id,
        "location_id": alert.location_id,
        "location_name": alert.location.name if alert.location else "Station",
        "severity": alert.severity,
        "title": alert.title,
        "message": alert.message,
        "recommendation": alert.recommendation,
        "status": alert.status,
        "created_at": alert.created_at
    }
