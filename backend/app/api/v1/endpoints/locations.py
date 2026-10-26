"""
Monitoring Stations & Catchments Endpoint
=========================================
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import Location
from app.schemas.location import LocationCreate, LocationResponse

router = APIRouter()


@router.get("/locations", response_model=List[LocationResponse], summary="List Monitored Locations")
def list_locations(
    active_only: bool = Query(True, description="Filter for active stations"),
    db: Session = Depends(get_db),
):
    query = db.query(Location)
    if active_only:
        query = query.filter(Location.is_active == True)
    return query.order_by(Location.id).all()


@router.get("/locations/{location_id}", response_model=LocationResponse, summary="Get Station Details")
def get_location(location_id: str, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")
    return loc


@router.post("/locations", response_model=LocationResponse, status_code=201, summary="Register New Location")
def create_location(location_in: LocationCreate, db: Session = Depends(get_db)):
    existing = db.query(Location).filter(Location.id == location_in.id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Location with ID '{location_in.id}' already exists.")

    new_loc = Location(**location_in.model_dump())
    db.add(new_loc)
    db.commit()
    db.refresh(new_loc)
    return new_loc
