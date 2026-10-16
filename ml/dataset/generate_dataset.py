import pandas as pd
import numpy as np
import os

def generate_flood_dataset(num_samples=2500, random_seed=42):
    np.random.seed(random_seed)
    
    # Generate realistic urban sensor metrics
    rainfall_5min = np.random.exponential(scale=3.0, size=num_samples).round(1)
    rainfall_15min = (rainfall_5min * np.random.uniform(1.8, 2.5, size=num_samples)).round(1)
    rainfall_30min = (rainfall_15min * np.random.uniform(1.4, 2.1, size=num_samples)).round(1)
    rainfall_60min = (rainfall_30min * np.random.uniform(1.2, 1.8, size=num_samples)).round(1)
    
    rainfall_intensity = (rainfall_60min * np.random.uniform(0.9, 1.3, size=num_samples)).round(1)
    temperature = np.random.normal(loc=27.0, scale=4.0, size=num_samples).round(1)
    humidity = np.clip(np.random.normal(loc=78.0, scale=12.0, size=num_samples), 40.0, 99.0).round(1)
    
    # Hydrological parameters
    water_level = np.clip(np.random.gamma(shape=3.0, scale=20.0, size=num_samples), 10.0, 240.0).round(1)
    water_level_change = np.random.normal(loc=2.5, scale=8.0, size=num_samples).round(1)
    
    # GIS attributes
    elevation = np.random.uniform(3.0, 95.0, size=num_samples).round(1)
    slope = np.random.uniform(0.5, 14.0, size=num_samples).round(1)
    historical_flood_count = np.random.poisson(lam=4.0, size=num_samples)
    drainage_risk = np.random.uniform(0.1, 0.95, size=num_samples).round(2)
    
    # Physical score calculation
    # Heavy rainfall + high water level + low elevation + high drainage risk = HIGH FLOOD PROBABILITY
    rain_score = (rainfall_30min / 60.0) * 0.35 + (rainfall_intensity / 100.0) * 0.25
    water_score = (water_level / 200.0) * 0.25 + (np.clip(water_level_change, 0, 30) / 25.0) * 0.15
    topo_score = (1.0 - np.clip(elevation / 80.0, 0, 1)) * 0.20 + (1.0 - np.clip(slope / 10.0, 0, 1)) * 0.10
    hist_score = (np.clip(historical_flood_count / 15.0, 0, 1)) * 0.10 + drainage_risk * 0.15
    
    raw_prob = (rain_score + water_score + topo_score + hist_score) / 1.55
    noise = np.random.normal(0, 0.04, size=num_samples)
    flood_probability = np.clip(raw_prob + noise, 0.01, 0.99).round(3)
    
    # Categorize Risk Level
    risk_levels = []
    for prob in flood_probability:
        if prob < 0.30:
            risk_levels.append("LOW")
        elif prob < 0.60:
            risk_levels.append("MODERATE")
        elif prob < 0.80:
            risk_levels.append("HIGH")
        else:
            risk_levels.append("CRITICAL")
            
    df = pd.DataFrame({
        "rainfall_5min": rainfall_5min,
        "rainfall_15min": rainfall_15min,
        "rainfall_30min": rainfall_30min,
        "rainfall_60min": rainfall_60min,
        "rainfall_intensity": rainfall_intensity,
        "temperature": temperature,
        "humidity": humidity,
        "water_level": water_level,
        "water_level_change": water_level_change,
        "elevation": elevation,
        "slope": slope,
        "historical_flood_count": historical_flood_count,
        "drainage_risk": drainage_risk,
        "flood_probability": flood_probability,
        "risk_level": risk_levels
    })
    
    output_dir = os.path.join(os.path.dirname(__file__))
    os.makedirs(output_dir, exist_ok=True)
    csv_path = os.path.join(output_dir, "urban_flood_data.csv")
    df.to_csv(csv_path, index=False)
    print(f"Generated {num_samples} samples saved to {csv_path}")
    return df

if __name__ == "__main__":
    generate_flood_dataset()
