import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score

from dataset.generate_dataset import generate_flood_dataset

FEATURE_COLUMNS = [
    "rainfall_5min",
    "rainfall_15min",
    "rainfall_30min",
    "rainfall_60min",
    "rainfall_intensity",
    "temperature",
    "humidity",
    "water_level",
    "water_level_change",
    "elevation",
    "slope",
    "historical_flood_count",
    "drainage_risk"
]

def train_model():
    dataset_path = os.path.join(os.path.dirname(__file__), "dataset", "urban_flood_data.csv")
    if not os.path.exists(dataset_path):
        df = generate_flood_dataset(2500)
    else:
        df = pd.read_csv(dataset_path)

    X = df[FEATURE_COLUMNS]
    y = df["flood_probability"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training Random Forest Regressor for Urban Flood Nowcasting...")
    model = RandomForestRegressor(n_estimators=150, max_depth=12, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"Model Performance -> MSE: {mse:.4f}, R2 Score: {r2:.4f}")

    # Feature importances
    importances = dict(zip(FEATURE_COLUMNS, model.feature_importances_.round(4)))
    print("Feature Importances:", importances)

    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, "flood_model.pkl")

    model_metadata = {
        "model": model,
        "features": FEATURE_COLUMNS,
        "importances": importances,
        "r2_score": r2,
        "mse": mse,
        "version": "1.0.0"
    }

    joblib.dump(model_metadata, model_path)
    print(f"Model and metadata saved successfully to {model_path}")
    return model_path

if __name__ == "__main__":
    train_model()
