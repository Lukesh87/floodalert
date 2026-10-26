"""
Comprehensive Automated Test Suite for Urban Flood Nowcasting API
=================================================================
"""

import pytest


def test_health_endpoint(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["UP", "DEGRADED"]
    assert "Coimbatore" in data["monitored_region"]["city"]
    assert data["ml_model_loaded"] is True


def test_locations_endpoints(client):
    res = client.get("/api/v1/locations")
    assert res.status_code == 200
    locations = res.json()
    assert len(locations) >= 1
    # Check that Lanka Corner or Ukkadam exists
    ids = [loc["id"] for loc in locations]
    assert "CBE-01" in ids

    # Detail endpoint
    detail_res = client.get("/api/v1/locations/CBE-01")
    assert detail_res.status_code == 200
    loc_detail = detail_res.json()
    assert loc_detail["name"] == "Lanka Corner Underpass"
    assert loc_detail["elevation_m"] <= 410.0


def test_weather_endpoint(client):
    res = client.get("/api/v1/weather/current")
    assert res.status_code == 200
    w = res.json()
    assert "temperature_c" in w
    assert "relative_humidity_pct" in w
    assert "weather_description" in w
    assert w["provider_status"] in ["LIVE", "CACHED", "OFFLINE_FALLBACK"]


def test_rainfall_endpoints(client):
    # Current rainfall
    res = client.get("/api/v1/rainfall?location_id=CBE-01")
    assert res.status_code == 200
    data = res.json()
    assert "rainfall_1h_mm" in data
    assert "rainfall_24h_mm" in data

    # Rainfall timeseries history
    hist_res = client.get("/api/v1/rainfall/history?location_id=CBE-01&window=24h")
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert len(hist["history"]) == 24
    assert hist["total_rainfall_mm"] >= 0.0


def test_flood_events(client):
    res = client.get("/api/v1/flood/events")
    assert res.status_code == 200
    events = res.json()
    assert len(events) >= 1
    # Check severity filter
    severe_res = client.get("/api/v1/flood/events?severity=Severe")
    assert severe_res.status_code == 200
    severe_events = severe_res.json()
    for ev in severe_events:
        assert ev["severity"] == "Severe"


def test_flood_risk_nowcast(client):
    res = client.get("/api/v1/flood/risk")
    assert res.status_code == 200
    risk_data = res.json()
    assert risk_data["city"] == "Coimbatore"
    assert "overall_risk_category" in risk_data
    assert len(risk_data["stations"]) >= 1


def test_ml_prediction_valid(client):
    payload = {
        "location_id": "CBE-01",
        "rainfall_1h": 45.0,
        "rainfall_3h": 75.0,
        "rainfall_24h": 110.0,
        "elevation_m": 404.2,
        "slope_deg": 1.1,
        "drainage_capacity_index": 0.35,
        "soil_moisture_pct": 85.0,
        "impervious_ratio": 0.92,
    }
    res = client.post("/api/v1/flood/predict", json=payload)
    assert res.status_code == 200
    pred = res.json()
    assert pred["risk_category"] in ["High", "Severe"]
    assert pred["risk_level"] in [2, 3]
    assert 0.0 <= pred["flood_probability"] <= 1.0
    assert len(pred["top_contributing_factors"]) > 0


def test_ml_prediction_negative_rainfall_rejected(client):
    payload = {
        "rainfall_1h": -10.0,
        "rainfall_3h": 20.0,
        "rainfall_24h": 30.0,
    }
    res = client.post("/api/v1/flood/predict", json=payload)
    assert res.status_code in [400, 422]


def test_alert_lifecycle_and_deduplication(client):
    # Create Alert
    alert_payload = {
        "severity": "Warning",
        "location_id": "CBE-04",
        "location_name": "Gandhipuram Central Bus Stand",
        "title": "Cross Cut Road Waterlogging Test Alert",
        "description": "Street ponding detected near complex.",
        "reason": "Rainfall threshold exceeded 35mm/h.",
    }
    create_res = client.post("/api/v1/alerts", json=alert_payload)
    assert create_res.status_code == 201
    alert_obj = create_res.json()
    alert_id = alert_obj["id"]

    # Test Deduplication: second alert for same station returns existing without duplicate spam
    dup_res = client.post("/api/v1/alerts", json=alert_payload)
    assert dup_res.status_code == 201
    assert dup_res.json()["id"] == alert_id

    # Acknowledge Alert
    ack_res = client.patch(
        f"/api/v1/alerts/{alert_id}",
        json={"status": "Acknowledged", "acknowledged_by": "Test Officer"},
    )
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "Acknowledged"
    assert ack_res.json()["acknowledged_by"] == "Test Officer"

    # Resolve Alert
    res_res = client.patch(
        f"/api/v1/alerts/{alert_id}",
        json={"status": "Resolved", "acknowledged_by": "Disaster Response Unit"},
    )
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "Resolved"


def test_model_status_and_metrics(client):
    status_res = client.get("/api/v1/model/status")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "LOADED_AND_READY"

    metrics_res = client.get("/api/v1/model/metrics")
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert "accuracy" in metrics
    assert "macro_f1" in metrics
    assert "confusion_matrix" in metrics
    assert "feature_importances" in metrics


def test_csv_ingestion_validation(client):
    csv_content = b"station_id,timestamp,rainfall_1h\nCBE-01,2026-10-22T10:00:00Z,25.4\nCBE-02,2026-10-22T10:00:00Z,18.2\n"
    res = client.post(
        "/api/v1/admin/ingest",
        files={"file": ("test_rainfall.csv", csv_content, "text/csv")},
    )
    assert res.status_code == 200
    report = res.json()
    assert report["success"] is True
    assert report["total_rows"] == 2
    assert report["valid_rows"] == 2
