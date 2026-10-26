"""
Machine Learning Model Inspection & Metrics Endpoints
=====================================================
"""

from fastapi import APIRouter, HTTPException

from app.ml.predictor import get_model_metrics, get_model_payload, is_model_available

router = APIRouter()


@router.get("/model/status", summary="Get ML Model Status & Version")
def model_status():
    ready = is_model_available()
    if not ready:
        return {
            "status": "UNAVAILABLE",
            "model_type": "None",
            "version": "None",
            "message": "No trained model artifact found. Train model to activate predictions.",
            "available_features": [],
        }

    payload = get_model_payload()
    return {
        "status": "LOADED_AND_READY",
        "model_type": payload.get("model_type", "RandomForestClassifier"),
        "version": payload.get("version", "1.0.0-cbe-rf"),
        "trained_at": payload.get("trained_at"),
        "n_estimators": payload.get("n_estimators", 120),
        "target_region": "Coimbatore, Tamil Nadu, India",
        "feature_names": payload.get("feature_names", []),
        "risk_classes": payload.get("risk_classes", []),
        "operational_mode": "ACTIVE_INFERENCE",
    }


@router.get("/model/metrics", summary="Get Model Evaluation Report & Performance Metrics")
def model_metrics():
    metrics = get_model_metrics()
    if not metrics:
        raise HTTPException(
            status_code=404,
            detail="Evaluation metrics not found. Run model training to generate evaluation report.",
        )
    return metrics
