from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Location, WeatherData, WaterLevel, Prediction
from app.schemas.schemas import LocationCreate, LocationUpdate, LocationOut
from app.routes.auth import get_admin_user

router = APIRouter(prefix="/locations", tags=["Locations"])

@router.get("", response_model=List[LocationOut])
def get_locations(db: Session = Depends(get_db)):
    locations = db.query(Location).all()
    results = []
    for loc in locations:
        latest_weather = db.query(WeatherData).filter(WeatherData.location_id == loc.id).order_by(WeatherData.timestamp.desc()).first()
        latest_water = db.query(WaterLevel).filter(WaterLevel.location_id == loc.id).order_by(WaterLevel.timestamp.desc()).first()
        latest_pred = db.query(Prediction).filter(Prediction.location_id == loc.id).order_by(Prediction.created_at.desc()).first()

        results.append({
            "id": loc.id,
            "name": loc.name,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "elevation": loc.elevation,
            "slope": loc.slope,
            "zone": loc.zone,
            "risk_level": loc.risk_level,
            "drainage_risk": loc.drainage_risk,
            "historical_flood_count": loc.historical_flood_count,
            "created_at": loc.created_at,
            "current_rainfall": latest_weather.rainfall if latest_weather else 0.0,
            "water_level": latest_water.water_level if latest_water else 0.0,
            "current_probability": latest_pred.probability_60 if latest_pred else 0.1,
            "last_updated": latest_weather.timestamp.strftime("%Y-%m-%d %H:%M") if latest_weather else "Just now"
        })
    return results

@router.get("/{location_id}", response_model=LocationOut)
def get_location(location_id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    
    latest_weather = db.query(WeatherData).filter(WeatherData.location_id == loc.id).order_by(WeatherData.timestamp.desc()).first()
    latest_water = db.query(WaterLevel).filter(WaterLevel.location_id == loc.id).order_by(WaterLevel.timestamp.desc()).first()
    latest_pred = db.query(Prediction).filter(Prediction.location_id == loc.id).order_by(Prediction.created_at.desc()).first()

    return {
        "id": loc.id,
        "name": loc.name,
        "latitude": loc.latitude,
        "longitude": loc.longitude,
        "elevation": loc.elevation,
        "slope": loc.slope,
        "zone": loc.zone,
        "risk_level": loc.risk_level,
        "drainage_risk": loc.drainage_risk,
        "historical_flood_count": loc.historical_flood_count,
        "created_at": loc.created_at,
        "current_rainfall": latest_weather.rainfall if latest_weather else 0.0,
        "water_level": latest_water.water_level if latest_water else 0.0,
        "current_probability": latest_pred.probability_60 if latest_pred else 0.1,
        "last_updated": latest_weather.timestamp.strftime("%Y-%m-%d %H:%M") if latest_weather else "Just now"
    }

@router.post("", response_model=LocationOut, status_code=status.HTTP_201_CREATED)
def create_location(
    location_in: LocationCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    loc = Location(**location_in.model_dump())
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return {
        "id": loc.id,
        "name": loc.name,
        "latitude": loc.latitude,
        "longitude": loc.longitude,
        "elevation": loc.elevation,
        "slope": loc.slope,
        "zone": loc.zone,
        "risk_level": loc.risk_level,
        "drainage_risk": loc.drainage_risk,
        "historical_flood_count": loc.historical_flood_count,
        "created_at": loc.created_at,
        "current_rainfall": 0.0,
        "water_level": 0.0,
        "current_probability": 0.05,
        "last_updated": "New Station"
    }

@router.put("/{location_id}", response_model=LocationOut)
def update_location(
    location_id: int,
    location_in: LocationUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    
    update_data = location_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(loc, field, val)
        
    db.commit()
    db.refresh(loc)
    return get_location(loc.id, db)

@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(loc)
    db.commit()
    return None
