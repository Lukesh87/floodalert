"""
Alert & Early Warning Management Service
========================================
Implements alert generation, deduplication cooldown windows,
acknowledgment lifecycle, and audit trail logging.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional
import uuid
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import Alert, AuditLog


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AlertService:
    @staticmethod
    def get_active_alerts(db: Session, location_id: Optional[str] = None) -> List[Alert]:
        now = utc_now()
        query = db.query(Alert).filter(Alert.status.in_(["Active", "Acknowledged"]))
        if location_id:
            query = query.filter(Alert.location_id == location_id)
        # Order by severity priority then newest
        return query.order_by(Alert.triggered_at.desc()).all()

    @staticmethod
    def get_all_alerts(db: Session, limit: int = 50) -> List[Alert]:
        return db.query(Alert).order_by(Alert.triggered_at.desc()).limit(limit).all()

    @staticmethod
    def create_alert(
        db: Session,
        location_id: str,
        location_name: str,
        severity: str,
        title: str,
        description: str,
        reason: str,
        source_trigger: str = "Automated Nowcast ML Model",
        expires_in_hours: int = 6,
    ) -> Optional[Alert]:
        """
        Creates an alert enforcing deduplication and cooldown rules.
        If an active alert exists for the same location within the cooldown window,
        it prevents duplicate spam.
        """
        now = utc_now()
        cooldown_threshold = now - timedelta(minutes=settings.ALERT_COOLDOWN_MINUTES)

        # Check existing active or recent alert for same station
        existing = (
            db.query(Alert)
            .filter(
                Alert.location_id == location_id,
                Alert.status.in_(["Active", "Acknowledged"]),
                Alert.triggered_at >= cooldown_threshold,
            )
            .first()
        )

        if existing:
            # Alert is suppressed under deduplication cooldown policy
            return existing

        alert_id = f"ALT-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        alert_code = f"CBE-{severity.upper()[:3]}-{location_id}"
        expires_at = now + timedelta(hours=expires_in_hours)
        cooldown_until = now + timedelta(minutes=settings.ALERT_COOLDOWN_MINUTES)

        alert = Alert(
            id=alert_id,
            alert_code=alert_code,
            severity=severity,
            status="Active",
            location_id=location_id,
            location_name=location_name,
            title=title,
            description=description,
            reason=reason,
            source_trigger=source_trigger,
            triggered_at=now,
            expires_at=expires_at,
            cooldown_until=cooldown_until,
        )

        db.add(alert)

        # Audit log entry
        audit = AuditLog(
            action="ALERT_TRIGGERED",
            entity_type="Alert",
            entity_id=alert_id,
            actor="SYSTEM_NOWCASTER",
            details=f"Triggered {severity} alert for {location_name}: {title}",
        )
        db.add(audit)
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def acknowledge_alert(db: Session, alert_id: str, acknowledged_by: str) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None

        alert.status = "Acknowledged"
        alert.acknowledged_at = utc_now()
        alert.acknowledged_by = acknowledged_by

        audit = AuditLog(
            action="ALERT_ACKNOWLEDGED",
            entity_type="Alert",
            entity_id=alert_id,
            actor=acknowledged_by,
            details=f"Alert {alert_id} acknowledged by duty officer {acknowledged_by}.",
        )
        db.add(audit)
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def resolve_alert(db: Session, alert_id: str, resolved_by: str) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None

        alert.status = "Resolved"
        alert.resolved_at = utc_now()

        audit = AuditLog(
            action="ALERT_RESOLVED",
            entity_type="Alert",
            entity_id=alert_id,
            actor=resolved_by,
            details=f"Alert {alert_id} marked as resolved.",
        )
        db.add(audit)
        db.commit()
        db.refresh(alert)
        return alert
