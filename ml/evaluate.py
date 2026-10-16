import os
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, mean_absolute_error, r2_score

from dataset.generate_dataset import generate_flood_dataset

def evaluate_model():
    model_path = os.path.join(os.path.dirname(__file__), "models", "flood_model.pkl")
    if not os.path.exists(model_path):
        print("Model file not found. Running training script first...")
        from train import train_model
        train_model()
        
    meta = joblib.load(model_path)
    model = meta["model"]
    features = meta["features"]

    dataset_path = os.path.join(os.path.dirname(__file__), "dataset", "urban_flood_data.csv")
    if not os.path.exists(dataset_path):
        df = generate_flood_dataset(500, random_seed=999)
    else:
        df = pd.read_csv(dataset_path)

    X = df[features]
    y_true_prob = df["flood_probability"]
    y_pred_prob = model.predict(X)

    mae = mean_absolute_error(y_true_prob, y_pred_prob)
    r2 = r2_score(y_true_prob, y_pred_prob)

    def to_risk_level(prob):
        if prob < 0.30: return "LOW"
        if prob < 0.60: return "MODERATE"
        if prob < 0.80: return "HIGH"
        return "CRITICAL"

    y_true_risk = [to_risk_level(p) for p in y_true_prob]
    y_pred_risk = [to_risk_level(p) for p in y_pred_prob]

    print("\n--- ML MODEL EVALUATION REPORT ---")
    print(f"MAE: {mae:.4f}")
    print(f"R2 Score: {r2:.4f}")
    print("\nClassification Report (Risk Thresholds):")
    print(classification_report(y_true_risk, y_pred_risk, target_names=["LOW", "MODERATE", "HIGH", "CRITICAL"]))

if __name__ == "__main__":
    evaluate_model()
