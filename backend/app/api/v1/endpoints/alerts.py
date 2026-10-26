"""
Alert & Early Warning Management Endpoints
==========================================
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import Alert
from app.schemas.alert import AlertCreate, AlertResponse, AlertUpdate
from app.services.alert_service import AlertService

router = APIRouter()


@router.get("/alerts", response_model=List[AlertResponse], summary="List Active & Historical Alerts")
def get_alerts(
    active_only: bool = Query(False, description="Filter only active alerts"),
    location_id: Optional[str] = Query(None, description="Filter by station ID"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    if active_only:
        alerts = AlertService.get_active_alerts(db, location_id=location_id)
    else:
        query = db.query(Alert)
        if location_id:
            query = query.filter(Alert.location_id == location_id)
        alerts = query.order_by(Alert.triggered_at.desc()).limit(limit).all()

    results = []
    for a in alerts:
        results.append(
            AlertResponse(
                id=a.id,
                alert_code=a.alert_code,
                severity=a.severity,
                status=a.status,
                location_id=a.location_id,
                location_name=a.location_name,
                title=a.title,
                description=a.description,
                reason=a.reason,
                source_trigger=a.source_trigger,
                triggered_at=a.triggered_at.isoformat() if hasattr(a.triggered_at, 'isoformat') else str(a.triggered_at),
                expires_at=a.expires_at.isoformat() if hasattr(a.expires_at, 'isoformat') else str(a.expires_at),
                acknowledged_at=a.acknowledged_at.isoformat() if a.acknowledged_at and hasattr(a.acknowledged_at, 'isoformat') else str(a.acknowledged_at) if a.acknowledged_at else None,
                acknowledged_by=a.acknowledged_by,
                resolved_at=a.resolved_at.isoformat() if a.resolved_at and hasattr(a.resolved_at, 'isoformat') else str(a.resolved_at) if a.resolved_at else None,
                cooldown_until=a.cooldown_until.isoformat() if a.cooldown_until and hasattr(a.cooldown_until, 'isoformat') else str(a.cooldown_until) if a.cooldown_until else None,
                is_active=a.status in ["Active", "Acknowledged"],
            )
        )
    return results


@router.post("/alerts", response_model=AlertResponse, status_code=201, summary="Trigger New Early Warning Alert")
def create_alert(
    alert_in: AlertCreate,
    db: Session = Depends(get_db),
):
    alert = AlertService.create_alert(
        db=db,
        location_id=alert_in.location_id,
        location_name=alert_in.location_name,
        severity=alert_in.severity,
        title=alert_in.title,
        description=alert_in.description,
        reason=alert_in.reason,
        source_trigger=alert_in.source_trigger,
        expires_in_hours=alert_in.expires_in_hours or 6,
    )

    return AlertResponse(
        id=alert.id,
        alert_code=alert.alert_code,
        severity=alert.severity,
        status=alert.status,
        location_id=alert.location_id,
        location_name=alert.location_name,
        title=alert.title,
        description=alert.description,
        reason=alert.reason,
        source_trigger=alert.source_trigger,
        triggered_at=alert.triggered_at.isoformat() if hasattr(alert.triggered_at, 'isoformat') else str(alert.triggered_at),
        expires_at=alert.expires_at.isoformat() if hasattr(alert.expires_at, 'isoformat') else str(alert.expires_at),
        acknowledged_at=alert.acknowledged_at.isoformat() if alert.acknowledged_at and hasattr(alert.acknowledged_at, 'isoformat') else None,
        acknowledged_by=alert.acknowledged_by,
        resolved_at=alert.resolved_at.isoformat() if alert.resolved_at and hasattr(alert.resolved_at, 'isoformat') else None,
        cooldown_until=alert.cooldown_until.isoformat() if alert.cooldown_until and hasattr(alert.cooldown_until, 'isoformat') else None,
        is_active=alert.status in ["Active", "Acknowledged"],
    )


@router.patch("/alerts/{alert_id}", response_model=AlertResponse, summary="Acknowledge or Resolve Alert")
def update_alert(
    alert_id: str,
    update_in: AlertUpdate,
    db: Session = Depends(get_db),
):
    target = db.query(Alert).filter(Alert.id == alert_id).first()
    if not target:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")

    if update_in.status == "Acknowledged":
        officer = update_in.acknowledged_by or "Municipal Duty Officer"
        alert = AlertService.acknowledge_alert(db, alert_id=alert_id, acknowledged_by=officer)
    elif update_in.status == "Resolved":
        officer = update_in.acknowledged_by or "Disaster Response Unit"
        alert = AlertService.resolve_alert(db, alert_id=alert_id, resolved_by=officer)
    else:
        alert = target

    return AlertResponse(
        id=alert.id,
        alert_code=alert.alert_code,
        severity=alert.severity,
        status=alert.status,
        location_id=alert.location_id,
        location_name=alert.location_name,
        title=alert.title,
        description=alert.description,
        reason=alert.reason,
        source_trigger=alert.source_trigger,
        triggered_at=alert.triggered_at.isoformat() if hasattr(alert.triggered_at, 'isoformat') else str(alert.triggered_at),
        expires_at=alert.expires_at.isoformat() if hasattr(alert.expires_at, 'isoformat') else str(alert.expires_at),
        acknowledged_at=alert.acknowledged_at.isoformat() if alert.acknowledged_at and hasattr(alert.acknowledged_at, 'isoformat') else None,
        acknowledged_by=alert.acknowledged_by,
        resolved_at=alert.resolved_at.isoformat() if alert.resolved_at and hasattr(alert.resolved_at, 'isoformat') else None,
        cooldown_until=alert.cooldown_until.isoformat() if alert.cooldown_until and hasattr(alert.cooldown_until, 'isoformat') else None,
        is_active=alert.status in ["Active", "Acknowledged"],
    )
