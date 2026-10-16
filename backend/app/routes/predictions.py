from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.schemas import PredictionInput, PredictionOut
from app.services.prediction_service import prediction_service

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.get("", response_model=List[PredictionOut])
def get_all_latest_predictions(db: Session = Depends(get_db)):
    return prediction_service.get_latest_predictions(db)

@router.get("/{location_id}", response_model=PredictionOut)
def get_prediction_for_location(location_id: int, db: Session = Depends(get_db)):
    try:
        return prediction_service.predict_for_location(db, location_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/predict", response_model=PredictionOut)
def run_custom_prediction(payload: PredictionInput, db: Session = Depends(get_db)):
    loc_id = payload.location_id or 1
    custom_data = payload.model_dump()
    try:
        return prediction_service.predict_for_location(db, loc_id, custom_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
