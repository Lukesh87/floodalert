# Urban Flood Nowcasting & Early Warning System 🌊⛈️

An intelligent full-stack system for real-time urban flood risk prediction, nowcasting, monitoring, and automated early warning alerts.

---

## 🚀 Key Features

- **Machine Learning Nowcasting**: Random Forest Regression model trained on rainfall intensity, elevation, water level change, slope, drainage capacity, and historical risk factors.
- **FastAPI High-Performance Backend**: RESTful API endpoints for weather integration, zone-based risk assessment, authentication, and alert dispatching.
- **Modern Interactive Dashboard**: Built with React 19 and Vite featuring real-time risk gauges, interactive geo-hazard map, severity alert toggles, and sensor telemetry.
- **Automated Alerts**: Real-time notifications for critical threshold breaches with severity status (Normal, Moderate, High, Severe).

---

## 📂 Project Structure

```
├── backend/            # FastAPI REST backend
│   ├── app/
│   │   ├── models/     # SQLAlchemy database models
│   │   ├── routes/     # API routes (weather, predictions, alerts, dashboard)
│   │   ├── schemas/    # Pydantic validation schemas
│   │   └── services/   # Prediction & ML inference pipeline
│   ├── main.py         # Application entrypoint
│   └── requirements.txt
├── frontend/           # React 19 + Vite frontend
│   ├── src/
│   │   ├── components/ # Dashboard, Risk Map, Alert Manager
│   │   ├── api.js      # API client
│   │   └── App.jsx
│   └── package.json
└── ml/                 # Machine learning pipeline
    ├── dataset/        # Synthetic and empirical flood datasets
    ├── models/         # Trained scikit-learn models (.pkl)
    ├── train.py        # Model training script
    └── predict.py      # Inference utility
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API Documentation will be live at: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧠 Machine Learning Model
To retrain the Random Forest model:
```bash
cd ml
python train.py
```
Model evaluation metrics and `.pkl` artifact will be saved in `ml/models/`.
