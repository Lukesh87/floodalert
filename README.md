# Urban Flood Nowcasting System
## AI-Powered Hydrological Prediction & Early Warning Platform (Coimbatore, Tamil Nadu)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-Random--Forest-F7931E.svg?logo=scikit-learn)](https://scikit-learn.org)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900.svg?logo=leaflet)](https://leafletjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise environmental intelligence platform for near real-time urban flood risk estimation, micro-catchment terrain modeling, and early warning dispatch. Initialized and calibrated for the urban agglomeration of **Coimbatore, Tamil Nadu, India (11.0168° N, 76.9558° E)**.

---

## 1. System Architecture

```mermaid
graph TD
    subgraph Data Sources & Telemetry
        IMD[IMD Automatic Weather Stations]
        OM[Open-Meteo Weather API]
        TNSDMA[TNSDMA Verified Flood Archive]
        CCMC[CCMC Storm Drainage Registry]
    end

    subgraph Backend Core (FastAPI & Python 3.13)
        API[FastAPI REST API v1]
        WS[Weather Ingestion & Caching Service]
        AS[Alert Service & Deduplication Cooldown]
        IS[CSV Quality Assurance & Ingestion]
        FS[Flood Risk Nowcasting Aggregator]
        DB[(SQLAlchemy ORM / SQLite / PostGIS)]
    end

    subgraph Machine Learning Engine
        RF[Random Forest Classifier (120 Trees)]
        FE[Hydrological Feature Engineering]
        CAL[Calibrated Probability & Uncertainty (Entropy)]
    end

    subgraph Frontend Client (React 19, TypeScript & Vite)
        OD[Overview Telemetry Dashboard]
        IM[Interactive Leaflet Basin Map]
        WM[Atmospheric & Radar Nowcast]
        FP[AI Risk Simulation Engine]
        HF[Verified Flood Incident Archive]
        AM[Emergency Early Warning Dispatch]
        AD[Admin QA & Model Metrics]
    end

    IMD --> WS
    OM --> WS
    TNSDMA --> DB
    CCMC --> DB

    WS --> API
    AS --> API
    IS --> API
    FS --> API

    API <--> DB
    FS <--> RF
    FE --> RF
    RF --> CAL

    API <--> OD
    API <--> IM
    API <--> WM
    API <--> FP
    API <--> HF
    API <--> AM
    API <--> AD
```

---

## 2. Coimbatore Regional & Hydrological Context

Coimbatore is situated in the rain shadow of the Western Ghats along the Noyyal River basin (Cauvery tributary). Due to rapid urbanization, heavy surface imperviousness (75%–95%), and low-lying railway underpasses, sudden convective downpours (>40 mm/h) or Northeast monsoon depressions trigger severe urban flash ponding.

### Monitored Micro-Catchments
1. **Lanka Corner Railway Underpass (CBE-01)**: Lowest elevation in city center (404.2m MSL); recurrent flash-flood hotspot.
2. **Ukkadam Periyakulam Catchment (CBE-02)**: Major lake surplus weir and transit hub (408m MSL).
3. **Town Hall / Big Bazaar St (CBE-03)**: Dense heritage commercial center with drainage bottlenecks (410.5m MSL).
4. **Gandhipuram Central Bus Stand (CBE-04)**: Urban arterial corridor; Cross Cut Road ponding (420m MSL).
5. **Singanallur Lake & Trichy Road (CBE-05)**: Wetland overflow and highway backflow corridor (412m MSL).
6. **Peelamedu / TNAU Weather Station (CBE-06)**: Reference agro-meteorological station (425.3m MSL).
7. **Ramanathapuram / Sungam (CBE-07)**: Valankulam outflow zone (414m MSL).
8. **Podanur Railway Sub-Catchment (CBE-08)**: Southern railway culvert drainage dependency (418m MSL).
9. **Perur / Noyyal River Corridor (CBE-09)**: Upstream riverbank receiving hill runoff (432m MSL).
10. **Saravanampatti Tech Zone (CBE-10)**: Engineered IT corridor on higher ground (438m MSL).

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Leaflet, Recharts, Lucide React Icons |
| **Styling** | Vanilla CSS Design System with CSS Custom Properties, Glassmorphism, Theme Tokens |
| **Backend** | Python 3.11–3.13, FastAPI, Pydantic v2, Uvicorn |
| **Machine Learning** | Scikit-learn (Random Forest Classifier), Pandas, NumPy, Joblib |
| **Database** | SQLAlchemy 2.0, SQLite (default local) / PostgreSQL + PostGIS (production) |
| **Data Providers** | Open-Meteo European Weather Model, IMD Climate Norms, TNSDMA Incident Records |
| **Orchestration** | Docker, Docker Compose, Nginx |

---

## 4. Quick Start (Windows & VS Code)

### Prerequisites
- **Python 3.11+** installed (`python --version`)
- **Node.js 18+** installed (`node -v`)

### Step 1: Clone and Set Up Virtual Environment

```powershell
# Navigate to the project root
cd "MINI PROJECT (FSD)"

# Create virtual environment (if not already created)
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\activate

# Install backend dependencies
pip install -r backend\requirements.txt
```

### Step 2: Initialize Database and Train ML Model

```powershell
# Train the Random Forest Flood Prediction Model (Generates artifacts and metrics)
python scripts\train_model.py

# Seed Coimbatore micro-catchments & verified historical flood incidents
python scripts\seed_database.py
```

### Step 3: Run the FastAPI Backend Server

```powershell
cd backend
..\.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API root: `http://127.0.0.1:8000/`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/api/v1/docs`

### Step 4: Run the React Vite Frontend

In a second terminal window:

```powershell
cd frontend
npm install
npm run dev
```
- Frontend application URL: `http://localhost:5173/`

---

## 5. Docker Deployment (Multi-Container)

To run the entire stack (PostgreSQL + PostGIS, FastAPI Backend, and React Frontend via Nginx):

```bash
docker-compose up --build
```
- Web Application: `http://localhost:3000`
- API & Swagger Docs: `http://localhost:8000/api/v1/docs`
- PostGIS Database: `localhost:5432`

---

## 6. Machine Learning Pipeline & Evaluation

The system trains a 120-tree **Random Forest Classifier** with class-balanced weights on multi-catchment hydrological parameters.

### Hydrological Feature Set
- `rainfall_1h`: Immediate downpour rate (mm/h)
- `rainfall_3h`: Short-term storm accumulation (mm)
- `rainfall_24h`: Daily monsoon volume (mm)
- `rainfall_trend`: Instantaneous acceleration ratio
- `elevation_m`: Ground elevation MSL (meters)
- `slope_deg`: Topographic surface gradient (degrees)
- `drainage_capacity_index`: Engineered storm drain rating (0.1 to 1.0)
- `soil_moisture_pct`: Antecedent moisture saturation (0% to 100%)
- `impervious_ratio`: Asphalt/concrete surface fraction (0.0 to 1.0)

### Verified Model Benchmark Results (Held-Out Test Split)
- **Model Accuracy**: **88.32%** (vs 40.0% majority class baseline)
- **Macro F1-Score**: **84.36%**
- **Macro Recall**: **87.71%**
- **Macro Precision**: **82.21%**
- **ROC-AUC (One-vs-Rest)**: **0.9820**

### Global Feature Importance
1. `rainfall_1h`: 21.75%
2. `elevation_m`: 13.78%
3. `rainfall_trend`: 12.66%
4. `slope_deg`: 12.54%
5. `rainfall_3h`: 11.45%
6. `rainfall_24h`: 10.17%
7. `drainage_capacity_index`: 6.73%
8. `impervious_ratio`: 5.62%
9. `soil_moisture_pct`: 5.31%

---

## 7. Automated Test Suite

Run the full pytest suite for API contracts, database operations, alert deduplication, and ML inference:

```powershell
cd backend
..\.venv\Scripts\pytest -v
```

### Verified Test Results
```text
tests/test_api.py::test_health_endpoint PASSED                           [  9%]
tests/test_api.py::test_locations_endpoints PASSED                       [ 18%]
tests/test_api.py::test_weather_endpoint PASSED                          [ 27%]
tests/test_api.py::test_rainfall_endpoints PASSED                        [ 36%]
tests/test_api.py::test_flood_events PASSED                              [ 45%]
tests/test_api.py::test_flood_risk_nowcast PASSED                        [ 54%]
tests/test_api.py::test_ml_prediction_valid PASSED                       [ 63%]
tests/test_api.py::test_ml_prediction_negative_rainfall_rejected PASSED  [ 72%]
tests/test_api.py::test_alert_lifecycle_and_deduplication PASSED         [ 81%]
tests/test_api.py::test_model_status_and_metrics PASSED                  [ 90%]
tests/test_api.py::test_csv_ingestion_validation PASSED                  [100%]
======================= 11 passed in 12.47s ========================
```

---

## 8. API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | System health, database connection, and model readiness |
| `GET` | `/api/v1/locations` | List all monitored Coimbatore micro-catchments |
| `GET` | `/api/v1/locations/{id}` | Detailed station terrain and hydrological parameters |
| `GET` | `/api/v1/weather/current` | Real-time weather observations (Open-Meteo synced) |
| `GET` | `/api/v1/weather/forecast` | 48-hour hourly precipitation probability & temperature forecast |
| `GET` | `/api/v1/rainfall` | Current precipitation intensity and accumulation (3h/6h/24h/72h) |
| `GET` | `/api/v1/rainfall/history`| 24h, 72h, or 7d hyetograph timeseries |
| `GET` | `/api/v1/flood/risk` | Citywide nowcast flood risk across all micro-catchments |
| `GET` | `/api/v1/flood/events` | Verified historical flood incident archive with filters |
| `POST`| `/api/v1/flood/predict` | Real-time Random Forest ML inference and explanation |
| `GET` | `/api/v1/alerts` | List active, acknowledged, and historical early warning alerts |
| `POST`| `/api/v1/alerts` | Dispatch early warning alert with deduplication cooldown |
| `PATCH`| `/api/v1/alerts/{id}` | Acknowledge or resolve an early warning alert |
| `GET` | `/api/v1/model/status` | ML model version, estimator count, and operational state |
| `GET` | `/api/v1/model/metrics` | Model evaluation report, ROC-AUC, and feature importances |
| `GET` | `/api/v1/admin/sources` | External telemetry data sources status (IMD, CCMC, TNSDMA) |
| `POST`| `/api/v1/admin/ingest` | Upload and validate CSV dataset with automated QA report |

---

## 9. Scientific Limitations & Emergency Notice

1. **Supplemental Platform**: This software provides predictive urban nowcasting intelligence to support emergency management authorities and the public. It **supplements, rather than replaces**, statutory bulletins issued by the India Meteorological Department (IMD) and the Tamil Nadu State Disaster Management Authority (TNSDMA).
2. **Hydrological Scope**: The machine learning model estimates surface-runoff pluvial flood probabilities for urban catchments based on rainfall intensity and local topography. It does not model sudden structural embankment collapses, catastrophic dam breaches, or unmapped sewer structural blockages.
3. **Emergency Contacts**:
   - Coimbatore District Disaster Management Control Room: **1077 / 0422-2301114**
   - TNSDMA State Emergency Operation Center: **1070**
   - Fire & Rescue Services: **101 / 112**
