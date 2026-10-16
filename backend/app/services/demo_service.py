import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.models import User, Location, WeatherData, WaterLevel, FloodEvent, Prediction, Alert
from app.utils.security import get_password_hash

DEMO_LOCATIONS = [
    {
        "name": "Gandhipuram Central Junction",
        "latitude": 11.0168,
        "longitude": 76.9558,
        "elevation": 12.5,
        "slope": 1.2,
        "zone": "Commercial Downtown",
        "drainage_risk": 0.85,
        "historical_flood_count": 8,
        "risk_level": "CRITICAL"
    },
    {
        "name": "North Riverside Promenade",
        "latitude": 11.0250,
        "longitude": 76.9620,
        "elevation": 8.0,
        "slope": 0.8,
        "zone": "Lowland River Basin",
        "drainage_risk": 0.90,
        "historical_flood_count": 12,
        "risk_level": "HIGH"
    },
    {
        "name": "Metro Plaza Underpass",
        "latitude": 11.0080,
        "longitude": 76.9510,
        "elevation": 6.5,
        "slope": 3.5,
        "zone": "Transit Hub",
        "drainage_risk": 0.78,
        "historical_flood_count": 6,
        "risk_level": "HIGH"
    },
    {
        "name": "Industrial Park West",
        "latitude": 11.0320,
        "longitude": 76.9380,
        "elevation": 28.0,
        "slope": 4.5,
        "zone": "Industrial Zone",
        "drainage_risk": 0.40,
        "historical_flood_count": 2,
        "risk_level": "LOW"
    },
    {
        "name": "South Lowland Suburb",
        "latitude": 10.9950,
        "longitude": 76.9680,
        "elevation": 15.0,
        "slope": 2.0,
        "zone": "Residential District",
        "drainage_risk": 0.65,
        "historical_flood_count": 5,
        "risk_level": "MODERATE"
    },
    {
        "name": "East Lake Promenade",
        "latitude": 11.0120,
        "longitude": 76.9820,
        "elevation": 18.5,
        "slope": 1.8,
        "zone": "Recreational / Lake Margin",
        "drainage_risk": 0.55,
        "historical_flood_count": 4,
        "risk_level": "MODERATE"
    },
    {
        "name": "Airport Bypass Tunnel",
        "latitude": 11.0280,
        "longitude": 77.0100,
        "elevation": 9.2,
        "slope": 4.0,
        "zone": "Infrastructure Infrastructure",
        "drainage_risk": 0.82,
        "historical_flood_count": 7,
        "risk_level": "HIGH"
    },
    {
        "name": "Tech Park Boulevard",
        "latitude": 11.0450,
        "longitude": 76.9950,
        "elevation": 42.0,
        "slope": 6.0,
        "zone": "IT Corridor",
        "drainage_risk": 0.25,
        "historical_flood_count": 0,
        "risk_level": "LOW"
    }
]

def seed_database(db: Session):
    # Check if seed users exist
    admin_user = db.query(User).filter(User.email == "admin@floodwarning.gov").first()
    if not admin_user:
        admin = User(
            name="System Administrator",
            email="admin@floodwarning.gov",
            password_hash=get_password_hash("admin123"),
            role="ADMIN"
        )
        user = User(
            name="Emergency Operator",
            email="user@floodwarning.gov",
            password_hash=get_password_hash("user123"),
            role="USER"
        )
        db.add_all([admin, user])
        db.commit()
        print("Created default admin (admin@floodwarning.gov) and user accounts.")

    # Check locations
    existing_locations = db.query(Location).count()
    if existing_locations == 0:
        print("Seeding 8 urban monitoring stations...")
        created_locs = []
        for loc_data in DEMO_LOCATIONS:
            loc = Location(**loc_data)
            db.add(loc)
            created_locs.append(loc)
        db.commit()

        # Seed initial weather, water levels, predictions, and alerts
        now = datetime.utcnow()
        for loc in created_locs:
            # Base weather
            if loc.risk_level == "CRITICAL":
                rain = 54.0
                intensity = 78.0
                water = 115.0
                prob_30, prob_60, prob_120 = 0.76, 0.88, 0.94
            elif loc.risk_level == "HIGH":
                rain = 42.0
                intensity = 58.0
                water = 82.0
                prob_30, prob_60, prob_120 = 0.58, 0.74, 0.82
            elif loc.risk_level == "MODERATE":
                rain = 22.0
                intensity = 32.0
                water = 52.0
                prob_30, prob_60, prob_120 = 0.32, 0.48, 0.55
            else:
                rain = 5.0
                intensity = 8.0
                water = 22.0
                prob_30, prob_60, prob_120 = 0.08, 0.14, 0.18

            weather = WeatherData(
                location_id=loc.id,
                temperature=26.5,
                humidity=86.0,
                rainfall=rain,
                rainfall_intensity=intensity,
                wind_speed=18.5,
                weather_condition="Torrential Rain" if rain > 30 else "Moderate Rain",
                precipitation_prob=85.0 if rain > 20 else 40.0,
                timestamp=now
            )
            
            water_lvl = WaterLevel(
                location_id=loc.id,
                water_level=water,
                water_level_change=12.5 if rain > 30 else 2.0,
                timestamp=now
            )

            pred = Prediction(
                location_id=loc.id,
                probability_30=prob_30,
                probability_60=prob_60,
                probability_120=prob_120,
                risk_level=loc.risk_level,
                explanation=f"Flood risk is {loc.risk_level} due to rainfall rate of {intensity} mm/hr and elevation of {loc.elevation}m.",
                model_version="RandomForest v1.0",
                created_at=now
            )

            db.add_all([weather, water_lvl, pred])

            # Generate sample alert for HIGH or CRITICAL stations
            if loc.risk_level in ["HIGH", "CRITICAL"]:
                alert = Alert(
                    location_id=loc.id,
                    severity=loc.risk_level,
                    title=f"🚨 {loc.risk_level} FLOOD WARNING: {loc.name}",
                    message=f"Water level rising rapidly ({water} cm). Flood probability predicted at {int(prob_60*100)}% in 60 minutes.",
                    recommendation="Avoid low-lying underpasses and activate local drainage pumps immediately.",
                    status="ACTIVE",
                    created_at=now - timedelta(minutes=15)
                )
                db.add(alert)

            # Generate historical flood event log
            if loc.historical_flood_count > 3:
                event = FloodEvent(
                    location_id=loc.id,
                    severity=loc.risk_level,
                    start_time=now - timedelta(days=14),
                    end_time=now - timedelta(days=13, hours=18),
                    description="Severe monsoon inundation caused water logging up to 85cm."
                )
                db.add(event)

        db.commit()
        print("Database seeding completed successfully.")
