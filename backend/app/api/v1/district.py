from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.models import District, Village, DiseaseCase, WaterTest, HealthReport, Hospital, MedicineInventory, Notification
from pydantic import BaseModel

router = APIRouter(prefix="/district", tags=["District Health Officer Portal"])

class AlertBroadcast(BaseModel):
    title: str
    message: str
    district_name: str
    village_name: Optional[str] = None
    risk_level: str = "HIGH"
    target_role: str = "ALL"

@router.get("/gis-summary")
def get_district_gis_summary(state_name: Optional[str] = None, db: Session = Depends(get_db)):
    districts = db.query(District).all()
    villages = db.query(Village).all()
    water_tests = db.query(WaterTest).all()
    cases = db.query(DiseaseCase).all()
    hospitals = db.query(Hospital).all()

    return {
        "districts": districts,
        "villages": villages,
        "water_tests": water_tests,
        "disease_cases": cases,
        "hospitals": hospitals
    }

@router.get("/metrics")
def get_district_metrics(district_name: Optional[str] = "Kamrup Metropolitan", db: Session = Depends(get_db)):
    total_cases = db.query(DiseaseCase).filter(DiseaseCase.district_name == district_name).all()
    active_cnt = sum(c.count for c in total_cases if c.status in ["ACTIVE", "CRITICAL"])
    recovered_cnt = sum(c.count for c in total_cases if c.status == "RECOVERED")
    critical_villages = db.query(Village).filter(Village.district_id == District.id, Village.risk_level.in_(["HIGH", "CRITICAL"])).count()
    water_unsafe = db.query(WaterTest).filter(WaterTest.district_name == district_name, WaterTest.is_safe == False).count()

    return {
        "district_name": district_name,
        "active_cases": active_cnt,
        "recovered_cases": recovered_cnt,
        "total_cases_logged": active_cnt + recovered_cnt,
        "high_risk_villages_count": critical_villages,
        "contaminated_water_sources": water_unsafe,
        "risk_index": 76.4
    }

@router.post("/broadcast-alert")
def broadcast_district_alert(alert: AlertBroadcast, db: Session = Depends(get_db)):
    db_notif = Notification(
        title=alert.title,
        message=alert.message,
        district_name=alert.district_name,
        village_name=alert.village_name,
        risk_level=alert.risk_level,
        target_role=alert.target_role
    )
    db.add(db_notif)
    db.commit()
    return {"message": "Emergency alert successfully broadcasted to district channels.", "alert": alert}
