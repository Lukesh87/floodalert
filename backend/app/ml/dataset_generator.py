"""
Coimbatore Hydrological & Urban Flood Synthetic Dataset Generator
==================================================================
Generates scientifically sound rainfall, terrain, and hydrological feature distributions
based on Coimbatore's semi-arid tropical monsoon climate (Northeast monsoon: Oct-Dec,
Southwest monsoon: June-Aug, Pre-monsoon: April-May), topography, and urban catchments.
"""

import json
import os
from pathlib import Path
import numpy as np
import pandas as pd

STATIONS_FILE = Path(__file__).parent.parent.parent.parent / "data" / "coimbatore_stations.json"


def load_stations():
    if not STATIONS_FILE.exists():
        # Fallback inline stations if file not found
        return [
            {"id": "CBE-01", "name": "Lanka Corner Underpass", "elevation_m": 404.2, "slope_deg": 1.1, "drainage_capacity_index": 0.35, "impervious_ratio": 0.92},
            {"id": "CBE-02", "name": "Ukkadam Periyakulam Catchment", "elevation_m": 408.0, "slope_deg": 0.8, "drainage_capacity_index": 0.48, "impervious_ratio": 0.78},
            {"id": "CBE-03", "name": "Town Hall / Big Bazaar St", "elevation_m": 410.5, "slope_deg": 1.4, "drainage_capacity_index": 0.52, "impervious_ratio": 0.95},
            {"id": "CBE-04", "name": "Gandhipuram Central Bus Stand", "elevation_m": 420.0, "slope_deg": 1.8, "drainage_capacity_index": 0.60, "impervious_ratio": 0.88},
            {"id": "CBE-05", "name": "Singanallur Lake & Trichy Rd", "elevation_m": 412.0, "slope_deg": 0.9, "drainage_capacity_index": 0.45, "impervious_ratio": 0.82},
            {"id": "CBE-06", "name": "Peelamedu / TNAU Weather Station", "elevation_m": 425.3, "slope_deg": 2.2, "drainage_capacity_index": 0.75, "impervious_ratio": 0.65},
            {"id": "CBE-07", "name": "Ramanathapuram / Sungam", "elevation_m": 414.0, "slope_deg": 1.2, "drainage_capacity_index": 0.50, "impervious_ratio": 0.85},
            {"id": "CBE-08", "name": "Podanur Railway Sub-Catchment", "elevation_m": 418.0, "slope_deg": 1.5, "drainage_capacity_index": 0.58, "impervious_ratio": 0.70},
            {"id": "CBE-09", "name": "Perur / Noyyal River Corridor", "elevation_m": 432.0, "slope_deg": 2.5, "drainage_capacity_index": 0.68, "impervious_ratio": 0.55},
            {"id": "CBE-10", "name": "Saravanampatti Tech Zone", "elevation_m": 438.0, "slope_deg": 2.8, "drainage_capacity_index": 0.80, "impervious_ratio": 0.75},
        ]
    with open(STATIONS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def generate_flood_training_data(n_samples: int = 1500, random_state: int = 42) -> pd.DataFrame:
    """
    Synthesize hydrological observation records combining:
    - Dry and light rain events (normal conditions)
    - Moderate showers (urban ponding borderline)
    - Heavy and very heavy rainfall events (IMD definition: >64.5mm/day, >115.5mm/day)
    - Convective cloudburst spikes (>40mm/h)
    """
    np.random.seed(random_state)
    stations = load_stations()
    records = []

    for i in range(n_samples):
        station = stations[np.random.randint(0, len(stations))]
        station_id = station["id"]
        elev = float(station["elevation_m"]) + np.random.normal(0, 0.5)
        slope = max(0.2, float(station["slope_deg"]) + np.random.normal(0, 0.1))
        drainage = np.clip(float(station["drainage_capacity_index"]) + np.random.normal(0, 0.05), 0.15, 0.95)
        impervious = np.clip(float(station["impervious_ratio"]) + np.random.normal(0, 0.03), 0.3, 0.98)

        # Weather regime sampling
        # 60% dry/light, 25% moderate, 10% heavy monsoon, 5% extreme cloudburst
        regime = np.random.choice(["dry", "moderate", "heavy", "extreme"], p=[0.60, 0.25, 0.10, 0.05])

        if regime == "dry":
            r_1h = np.random.exponential(scale=1.5)
            r_3h = r_1h + np.random.exponential(scale=2.0)
            r_24h = r_3h + np.random.exponential(scale=5.0)
            soil_moist = np.random.uniform(15.0, 45.0)
        elif regime == "moderate":
            r_1h = np.random.uniform(5.0, 22.0)
            r_3h = r_1h + np.random.uniform(8.0, 28.0)
            r_24h = r_3h + np.random.uniform(15.0, 40.0)
            soil_moist = np.random.uniform(40.0, 70.0)
        elif regime == "heavy":
            r_1h = np.random.uniform(20.0, 45.0)
            r_3h = r_1h + np.random.uniform(30.0, 60.0)
            r_24h = r_3h + np.random.uniform(35.0, 85.0)
            soil_moist = np.random.uniform(65.0, 92.0)
        else: # extreme cloudburst
            r_1h = np.random.uniform(45.0, 90.0)
            r_3h = r_1h + np.random.uniform(30.0, 70.0)
            r_24h = r_3h + np.random.uniform(40.0, 95.0)
            soil_moist = np.random.uniform(75.0, 98.0)

        # Derived rainfall trend (instantaneous acceleration ratio)
        avg_3h_rate = (r_3h / 3.0) + 0.001
        r_trend = r_1h / avg_3h_rate

        # Hydrological Runoff Potential Index (Physics-guided score)
        # Higher rainfall, higher imperviousness, higher soil moisture, lower elevation, lower drainage -> Higher flood risk
        elevation_penalty = max(0.0, (438.0 - elev) / 35.0) # lower ground has higher accumulation
        slope_drainage_factor = (1.0 / (slope + 0.5)) * (1.0 - drainage)

        risk_score = (
            (r_1h * 0.9)
            + (r_3h * 0.45)
            + (r_24h * 0.15)
            + (soil_moist * 0.25)
            + (impervious * 35.0)
            + (elevation_penalty * 25.0)
            + (slope_drainage_factor * 30.0)
            + (r_trend * 8.0)
            + np.random.normal(0, 4.0)
        )

        # Categorize into Low, Moderate, High, Severe
        if risk_score < 45.0:
            risk_category = "Low"
            risk_level = 0
            is_flooded = 0
        elif risk_score < 75.0:
            risk_category = "Moderate"
            risk_level = 1
            is_flooded = 0 if np.random.rand() > 0.30 else 1
        elif risk_score < 110.0:
            risk_category = "High"
            risk_level = 2
            is_flooded = 1
        else:
            risk_category = "Severe"
            risk_level = 3
            is_flooded = 1

        records.append({
            "station_id": station_id,
            "station_name": station["name"],
            "rainfall_1h": round(float(r_1h), 2),
            "rainfall_3h": round(float(r_3h), 2),
            "rainfall_24h": round(float(r_24h), 2),
            "rainfall_trend": round(float(r_trend), 3),
            "elevation_m": round(float(elev), 1),
            "slope_deg": round(float(slope), 2),
            "drainage_capacity_index": round(float(drainage), 3),
            "soil_moisture_pct": round(float(soil_moist), 1),
            "impervious_ratio": round(float(impervious), 3),
            "risk_score": round(float(risk_score), 2),
            "risk_category": risk_category,
            "risk_level": risk_level,
            "is_flooded": is_flooded
        })

    df = pd.DataFrame(records)
    return df


if __name__ == "__main__":
    df = generate_flood_training_data(2000)
    out_dir = Path(__file__).parent.parent.parent.parent / "data"
    out_path = out_dir / "coimbatore_flood_training_dataset.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} records saved to {out_path}")
    print("Class distribution:")
    print(df["risk_category"].value_counts(normalize=True))
