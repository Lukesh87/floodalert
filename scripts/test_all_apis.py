"""
Comprehensive API Validation Script
====================================
Tests all FastAPI REST endpoints across all categories:
Health, Locations, Weather, Rainfall, Flood Risk & ML Inference, Alerts, Model Ops, and Admin QA.
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from fastapi.testclient import TestClient
from app.main import app

def run_api_checks():
    client = TestClient(app)
    results = []
    
    def check(name, method, url, status=200, **kwargs):
        try:
            if method == "GET":
                res = client.get(url, **kwargs)
            elif method == "POST":
                res = client.post(url, **kwargs)
            elif method == "PATCH":
                res = client.patch(url, **kwargs)
            
            passed = (res.status_code == status)
            data = res.json() if passed else None
            results.append({
                "name": name,
                "endpoint": f"{method} {url}",
                "status_code": res.status_code,
                "passed": passed,
                "details": data
            })
            print(f"[{'PASS' if passed else 'FAIL'}] {method} {url} -> {res.status_code}")
            return data
        except Exception as e:
            results.append({
                "name": name,
                "endpoint": f"{method} {url}",
                "status_code": "ERROR",
                "passed": False,
                "details": str(e)
            })
            print(f"[FAIL] {method} {url} -> EXCEPTION: {e}")
            return None

    print("\n" + "="*70)
    print("RUNNING URBAN FLOOD NOWCASTING API VALIDATION SUITE")
    print("="*70 + "\n")

    # 1. Health
    check("System Health", "GET", "/api/v1/health")

    # 2. Locations
    locations = check("List Monitored Micro-catchments", "GET", "/api/v1/locations")
    if locations:
        print(f"   -> Total Stations Registered: {len(locations)}")
    check("Station Detail (Lanka Corner)", "GET", "/api/v1/locations/CBE-01")
    check("Station Detail (New: Sivananda Colony)", "GET", "/api/v1/locations/CBE-11")

    # 3. Weather
    check("Current Weather Observations", "GET", "/api/v1/weather/current")
    check("48h Short-term Weather Forecast", "GET", "/api/v1/weather/forecast")
    check("Weather Provider & Key Status", "GET", "/api/v1/weather/status")

    # 4. Rainfall
    check("Station Rainfall Accumulation", "GET", "/api/v1/rainfall?location_id=CBE-01")
    check("Rainfall 24h Timeseries History", "GET", "/api/v1/rainfall/history?location_id=CBE-01&window=24h")

    # 5. Flood Risk & ML Inference
    check("Aggregated City Flood Risk Nowcast", "GET", "/api/v1/flood/risk")
    
    events = check("Historical Flood Events Archive", "GET", "/api/v1/flood/events")
    if events:
        print(f"   -> Total Historical Incidents: {len(events)}")
    check("Filtered Flood Events (Severe)", "GET", "/api/v1/flood/events?severity=Severe")

    pred_payload = {
        "location_id": "CBE-01",
        "rainfall_1h": 46.5,
        "rainfall_3h": 82.0,
        "rainfall_24h": 115.0,
        "elevation_m": 404.2,
        "slope_deg": 1.1,
        "drainage_capacity_index": 0.35,
        "soil_moisture_pct": 88.0,
        "impervious_ratio": 0.92,
    }
    pred = check("ML Flood Inference (Random Forest)", "POST", "/api/v1/flood/predict", json=pred_payload)
    if pred:
        print(f"   -> Prediction Risk: {pred.get('risk_category')} (Probability: {pred.get('flood_probability'):.1%})")

    # 6. Alerts
    alerts = check("List All Alerts", "GET", "/api/v1/alerts")
    if alerts:
        print(f"   -> Total Alerts in System: {len(alerts)}")
    check("List Active Alerts Only", "GET", "/api/v1/alerts?active_only=true")

    # Test creating alert
    new_alert = check("Trigger Early Warning Alert", "POST", "/api/v1/alerts", status=201, json={
        "severity": "Warning",
        "location_id": "CBE-12",
        "location_name": "Valankulam Lake Promenade & Sungam Bypass",
        "title": "Automated Sluice Spillway Test Alert",
        "description": "Rising lake reservoir levels approaching 85% full capacity mark.",
        "reason": "Simulated heavy precipitation across upstream catchment."
    })

    if new_alert and "id" in new_alert:
        alert_id = new_alert["id"]
        check("Acknowledge Alert Lifecycle", "PATCH", f"/api/v1/alerts/{alert_id}", json={
            "status": "Acknowledged",
            "acknowledged_by": "Senior Disaster Response Officer"
        })

    # 7. Model Ops & Metrics
    check("ML Model Artifact Status", "GET", "/api/v1/model/status")
    metrics = check("Model Evaluation Metrics", "GET", "/api/v1/model/metrics")
    if metrics:
        print(f"   -> Model Accuracy: {metrics.get('accuracy', 0)*100:.2f}%, ROC-AUC: {metrics.get('roc_auc_ovr', 0):.3f}")

    # 8. Admin & Data Sources
    check("Data Sources Registry", "GET", "/api/v1/admin/sources")
    check("System Audit Log", "GET", "/api/v1/admin/audit")

    # 9. CSV Ingestion QA Check
    csv_bytes = b"station_id,timestamp,rainfall_1h\nCBE-01,2026-10-26T06:00:00Z,32.4\nCBE-11,2026-10-26T06:00:00Z,44.1\n"
    check("CSV QA Dataset Ingestion", "POST", "/api/v1/admin/ingest", files={"file": ("test_rain.csv", csv_bytes, "text/csv")})

    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)
    print("\n" + "="*70)
    print(f"VALIDATION SUMMARY: {passed_count}/{total_count} API ENDPOINTS VERIFIED WORKING PROPERLY")
    print("="*70 + "\n")
    return passed_count == total_count

if __name__ == "__main__":
    success = run_api_checks()
    sys.exit(0 if success else 1)
