import os
import joblib
import pandas as pd
import numpy as np

class FloodPredictor:
    def __init__(self, model_path=None):
        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), "models", "flood_model.pkl")
        
        self.model_path = model_path
        self.model = None
        self.features = [
            "rainfall_5min", "rainfall_15min", "rainfall_30min", "rainfall_60min",
            "rainfall_intensity", "temperature", "humidity", "water_level",
            "water_level_change", "elevation", "slope", "historical_flood_count",
            "drainage_risk"
        ]
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            try:
                meta = joblib.load(self.model_path)
                self.model = meta["model"]
                self.features = meta.get("features", self.features)
                print(f"Loaded ML Model version {meta.get('version', '1.0')} from {self.model_path}")
            except Exception as e:
                print(f"Error loading model pickle: {e}. Falling back to rule engine.")
                self.model = None
        else:
            print("Model file not found. System will train on first invocation or use fallback rule engine.")

    def classify_risk(self, probability: float) -> str:
        if probability < 0.30:
            return "LOW"
        elif probability < 0.60:
            return "MODERATE"
        elif probability < 0.80:
            return "HIGH"
        else:
            return "CRITICAL"

    def generate_explanation(self, input_data: dict, probability: float, risk_level: str) -> tuple[str, list]:
        factors = []
        
        rainfall_30 = input_data.get("rainfall_30min", 0)
        rainfall_intensity = input_data.get("rainfall_intensity", rainfall_30 * 1.5)
        water_level = input_data.get("water_level", 0)
        water_change = input_data.get("water_level_change", 0)
        elevation = input_data.get("elevation", 30)
        historical_floods = input_data.get("historical_flood_count", 3)

        if rainfall_intensity > 40 or rainfall_30 > 35:
            factors.append({
                "factor": "High Rainfall Intensity",
                "impact": "CRITICAL" if rainfall_intensity > 70 else "HIGH",
                "description": f"Rainfall rate of {rainfall_intensity} mm/hr exceeds standard urban drainage capacity."
            })
        
        if water_level > 100 or water_change > 8:
            factors.append({
                "factor": "Rapid Water Level Elevation",
                "impact": "HIGH",
                "description": f"Current water depth of {water_level} cm with positive change (+{water_change} cm/15min)."
            })
            
        if elevation < 15:
            factors.append({
                "factor": "Low-Lying Topography",
                "impact": "MODERATE",
                "description": f"Low elevation ({elevation} meters above sea level) promotes storm runoff accumulation."
            })

        if historical_floods > 5:
            factors.append({
                "factor": "Elevated Historical Inundation Frequency",
                "impact": "MODERATE",
                "description": f"Area has recorded {historical_floods} past flood incidents under similar storm conditions."
            })

        if not factors:
            factors.append({
                "factor": "Normal Hydrological Baseline",
                "impact": "LOW",
                "description": "Rainfall and water levels are well within safe operating thresholds."
            })

        top_factor_names = [f["factor"].lower() for f in factors[:3]]
        explanation = (
            f"Flood risk is {risk_level} (probability {int(probability * 100)}%) primarily due to "
            + ", ".join(top_factor_names) + "."
        )

        return explanation, factors

    def predict(self, input_data: dict) -> dict:
        # Fill missing features with reasonable defaults
        features_dict = {
            "rainfall_5min": input_data.get("rainfall_5min", input_data.get("rainfall_15min", 10) / 3.0),
            "rainfall_15min": input_data.get("rainfall_15min", 15.0),
            "rainfall_30min": input_data.get("rainfall_30min", 25.0),
            "rainfall_60min": input_data.get("rainfall_60min", 35.0),
            "rainfall_intensity": input_data.get("rainfall_intensity", input_data.get("rainfall_60min", 35.0) * 1.1),
            "temperature": input_data.get("temperature", 26.0),
            "humidity": input_data.get("humidity", 80.0),
            "water_level": input_data.get("water_level", 45.0),
            "water_level_change": input_data.get("water_level_change", 3.0),
            "elevation": input_data.get("elevation", 25.0),
            "slope": input_data.get("slope", 4.0),
            "historical_flood_count": input_data.get("historical_flood_count", 4),
            "drainage_risk": input_data.get("drainage_risk", 0.45)
        }

        if self.model is not None:
            df = pd.DataFrame([features_dict])[self.features]
            base_prob = float(self.model.predict(df)[0])
        else:
            # Fallback hydrological formula calculation
            rain = features_dict["rainfall_30min"] / 50.0
            water = features_dict["water_level"] / 150.0
            elev_inv = max(0, (50.0 - features_dict["elevation"]) / 50.0)
            base_prob = min(0.99, max(0.01, 0.4 * rain + 0.35 * water + 0.25 * elev_inv))

        base_prob = round(float(np.clip(base_prob, 0.01, 0.99)), 3)

        # Calculate 30-min, 60-min, and 120-min nowcasting horizons
        # 30 min: slightly lower or near current; 60 min: peak risk; 120 min: trailing or plateau
        prob_30 = round(float(np.clip(base_prob * 0.85 + (features_dict["rainfall_15min"] / 100.0), 0.01, 0.99)), 2)
        prob_60 = round(float(np.clip(base_prob * 1.05 + (features_dict["water_level_change"] / 50.0), 0.01, 0.99)), 2)
        prob_120 = round(float(np.clip(base_prob * 1.15 if base_prob > 0.5 else base_prob * 0.9, 0.01, 0.99)), 2)

        risk_level = self.classify_risk(prob_60)
        explanation, risk_factors = self.generate_explanation(features_dict, prob_60, risk_level)

        return {
            "location_id": input_data.get("location_id"),
            "probability": prob_60,
            "risk_level": risk_level,
            "forecast": {
                "30_min": prob_30,
                "60_min": prob_60,
                "120_min": prob_120
            },
            "explanation": explanation,
            "risk_factors": risk_factors,
            "input_summary": features_dict
        }

# Global predictor instance
predictor = FloodPredictor()
