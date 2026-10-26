"""
Coimbatore Flood Risk - Machine Learning Inference Engine
=========================================================
Handles model loading, input feature validation, probability calibration,
contributing feature analysis, and uncertainty quantification.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
import pandas as pd

MODEL_FILE = Path(__file__).parent / "artifacts" / "random_forest_flood_model.joblib"
METRICS_FILE = Path(__file__).parent / "artifacts" / "model_metrics.json"

_CACHED_MODEL_PAYLOAD: Optional[Dict[str, Any]] = None


def get_model_payload() -> Optional[Dict[str, Any]]:
    global _CACHED_MODEL_PAYLOAD
    if _CACHED_MODEL_PAYLOAD is not None:
        return _CACHED_MODEL_PAYLOAD

    if MODEL_FILE.exists():
        try:
            _CACHED_MODEL_PAYLOAD = joblib.load(MODEL_FILE)
            return _CACHED_MODEL_PAYLOAD
        except Exception as e:
            print(f"Error loading model artifact: {e}")
            return None
    return None


def get_model_metrics() -> Optional[Dict[str, Any]]:
    if METRICS_FILE.exists():
        try:
            with open(METRICS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading model metrics: {e}")
            return None
    return None


def is_model_available() -> bool:
    return MODEL_FILE.exists() and get_model_payload() is not None


def predict_flood_risk(features: Dict[str, float]) -> Dict[str, Any]:
    """
    Perform flood risk classification and probability estimation.
    Required features:
    - rainfall_1h (mm)
    - rainfall_3h (mm)
    - rainfall_24h (mm)
    - elevation_m (meters)
    - slope_deg (degrees)
    - drainage_capacity_index (0.1 to 1.0)
    - soil_moisture_pct (0 to 100%)
    - impervious_ratio (0 to 1.0)
    """
    payload = get_model_payload()
    if payload is None:
        raise ValueError(
            "Trained Machine Learning model artifact is not available. "
            "Please train the model first by running scripts/train_model.py or app/ml/train.py."
        )

    model = payload["model"]
    feature_names: List[str] = payload["feature_names"]
    risk_classes: List[str] = payload["risk_classes"]

    # Compute derived features if missing
    r_1h = float(features.get("rainfall_1h", 0.0))
    r_3h = float(features.get("rainfall_3h", r_1h))
    r_24h = float(features.get("rainfall_24h", r_3h))

    # Validate physical constraints
    if r_1h < 0 or r_3h < 0 or r_24h < 0:
        raise ValueError("Rainfall values cannot be negative.")
    if r_1h > r_3h:
        # Graceful correction if user provided 1h greater than 3h accumulation
        r_3h = max(r_3h, r_1h)
    if r_3h > r_24h:
        r_24h = max(r_24h, r_3h)

    # Derived rainfall trend (instant acceleration)
    if "rainfall_trend" not in features:
        avg_3h_rate = (r_3h / 3.0) + 0.001
        features["rainfall_trend"] = round(r_1h / avg_3h_rate, 3)

    # Build feature vector
    missing_keys = [k for k in feature_names if k not in features]
    if missing_keys:
        raise ValueError(f"Missing required hydrological features: {', '.join(missing_keys)}")

    feature_vector = pd.DataFrame([[float(features[k]) for k in feature_names]], columns=feature_names)

    # Inference
    predicted_class_idx = int(model.predict(feature_vector)[0])
    probabilities = model.predict_proba(feature_vector)[0]

    risk_category = risk_classes[predicted_class_idx]

    # Calculate overall flood probability (sum of High + Severe, plus 50% of Moderate)
    # Class probabilities: [p_low, p_mod, p_high, p_severe]
    prob_low = float(probabilities[0])
    prob_mod = float(probabilities[1]) if len(probabilities) > 1 else 0.0
    prob_high = float(probabilities[2]) if len(probabilities) > 2 else 0.0
    prob_severe = float(probabilities[3]) if len(probabilities) > 3 else 0.0

    flood_probability = round(prob_severe + prob_high + (0.45 * prob_mod), 4)

    # Uncertainty estimation (Normalized Shannon entropy)
    probs_non_zero = probabilities[probabilities > 0]
    entropy = -np.sum(probs_non_zero * np.log2(probs_non_zero))
    max_entropy = np.log2(len(risk_classes))
    uncertainty_score = round(float(entropy / max_entropy), 3)

    # Contributing factors analysis (normalized contribution based on tree weights)
    importances = model.feature_importances_
    contributions = []
    for name, imp in zip(feature_names, importances):
        val = features[name]
        # Impact assessment
        factor_desc = f"{name}: {val}"
        contributions.append({
            "feature": name,
            "value": val,
            "weight": round(float(imp), 4),
        })

    contributions.sort(key=lambda x: x["weight"], reverse=True)

    # Recommended action based on risk
    actions = {
        "Low": "Normal routine monitoring. Stormwater drains operating under design capacity.",
        "Moderate": "Advisory alert. Low-lying pedestrian walkways and underpasses should be checked for trash blockage.",
        "High": "Early warning active. Station automated pumps on standby. Barricade Lanka Corner and Kikani underpasses.",
        "Severe": "EMERGENCY FLOOD WARNING. High risk of life and transport gridlock. Activate municipal emergency pumps and evacuate low-lying bund settlements."
    }

    return {
        "risk_category": risk_category,
        "risk_level": predicted_class_idx,
        "flood_probability": flood_probability,
        "uncertainty_score": uncertainty_score,
        "uncertainty_level": "Low" if uncertainty_score < 0.4 else "Moderate" if uncertainty_score < 0.7 else "High",
        "probabilities": {
            "Low": round(prob_low, 4),
            "Moderate": round(prob_mod, 4),
            "High": round(prob_high, 4),
            "Severe": round(prob_severe, 4),
        },
        "top_contributing_factors": contributions[:4],
        "recommended_action": actions.get(risk_category, ""),
        "model_version": payload.get("version", "1.0.0-cbe-rf"),
        "model_type": payload.get("model_type", "RandomForestClassifier"),
    }
