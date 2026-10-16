import sys
import os
from datetime import datetime
from sqlalchemy.orm import Session

# Add project root to sys path so ml package is importable
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if project_root not in sys.path:
    sys.path.append(project_root)

from ml.predict import predictor
from app.models.models import Location, Prediction, Alert, WeatherData, WaterLevel

class PredictionService:
    def predict_for_location(self, db: Session, location_id: int, custom_features: dict = None) -> dict:
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise ValueError(f"Location ID {location_id} not found.")

        # Get latest weather and water level readings for location
        latest_weather = db.query(WeatherData).filter(WeatherData.location_id == location_id).order_by(WeatherData.timestamp.desc()).first()
        latest_water = db.query(WaterLevel).filter(WaterLevel.location_id == location_id).order_by(WaterLevel.timestamp.desc()).first()

        input_data = {
            "location_id": location.id,
            "rainfall_5min": latest_weather.rainfall / 4.0 if latest_weather else 12.0,
            "rainfall_15min": latest_weather.rainfall / 2.0 if latest_weather else 25.0,
            "rainfall_30min": latest_weather.rainfall if latest_weather else 45.0,
            "rainfall_60min": latest_weather.rainfall * 1.3 if latest_weather else 65.0,
            "rainfall_intensity": latest_weather.rainfall_intensity if latest_weather else 75.0,
            "temperature": latest_weather.temperature if latest_weather else 26.0,
            "humidity": latest_weather.humidity if latest_weather else 85.0,
            "water_level": latest_water.water_level if latest_water else 70.0,
            "water_level_change": latest_water.water_level_change if latest_water else 8.0,
            "elevation": location.elevation,
            "slope": location.slope,
            "historical_flood_count": location.historical_flood_count,
            "drainage_risk": location.drainage_risk
        }

        # Override with custom inputs if provided (e.g. from prediction page form or simulation)
        if custom_features:
            input_data.update(custom_features)

        result = predictor.predict(input_data)
        result["location_name"] = location.name

        # Save prediction record to database
        db_prediction = Prediction(
            location_id=location.id,
            probability_30=result["forecast"]["30_min"],
            probability_60=result["forecast"]["60_min"],
            probability_120=result["forecast"]["120_min"],
            risk_level=result["risk_level"],
            explanation=result["explanation"],
            model_version="RandomForest v1.0",
            created_at=datetime.utcnow()
        )
        db.add(db_prediction)

        # Update location risk level
        location.risk_level = result["risk_level"]

        # Check if automated alert should be generated (if risk >= HIGH and no recent active alert exists)
        if result["risk_level"] in ["HIGH", "CRITICAL"]:
            recent_alert = db.query(Alert).filter(
                Alert.location_id == location.id,
                Alert.status == "ACTIVE"
            ).first()
            
            if not recent_alert:
                new_alert = Alert(
                    location_id=location.id,
                    severity=result["risk_level"],
                    title=f"🚨 {result['risk_level']} FLOOD WARNING: {location.name}",
                    message=f"Model nowcasts a {int(result['probability']*100)}% flood probability in next 30-60 minutes.",
                    recommendation="Avoid low-lying roads, monitor storm drains, and follow local civil defense updates.",
                    status="ACTIVE",
                    created_at=datetime.utcnow()
                )
                db.add(new_alert)

        db.commit()
        db.refresh(db_prediction)

        result["id"] = db_prediction.id
        result["created_at"] = db_prediction.created_at
        return result

    def get_latest_predictions(self, db: Session):
        locations = db.query(Location).all()
        predictions = []
        for loc in locations:
            pred = db.query(Prediction).filter(Prediction.location_id == loc.id).order_by(Prediction.created_at.desc()).first()
            if pred:
                predictions.append({
                    "id": pred.id,
                    "location_id": loc.id,
                    "location_name": loc.name,
                    "probability": pred.probability_60,
                    "risk_level": pred.risk_level,
                    "forecast": {
                        "30_min": pred.probability_30,
                        "60_min": pred.probability_60,
                        "120_min": pred.probability_120
                    },
                    "explanation": pred.explanation or "Calculated baseline urban flood risk.",
                    "created_at": pred.created_at
                })
        return predictions

prediction_service = PredictionService()
