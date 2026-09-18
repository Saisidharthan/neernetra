from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.models import HealthReport, WaterTest, Prediction, Hospital, Notification, Village
from app.schemas.schemas import HealthReportCreate, HealthReportOut, WaterTestOut, PredictionRequest, PredictionOut
from app.ml.predictor import predictor

router = APIRouter(prefix="/citizen", tags=["Citizen Portal"])

@router.post("/reports", response_model=HealthReportOut)
def submit_health_complaint(report_in: HealthReportCreate, db: Session = Depends(get_db)):
    db_report = HealthReport(
        reporter_role="CITIZEN",
        patient_name=report_in.patient_name,
        patient_age=report_in.patient_age,
        patient_gender=report_in.patient_gender,
        village_name=report_in.village_name,
        district_name=report_in.district_name,
        state_name=report_in.state_name,
        symptoms=report_in.symptoms,
        suspected_disease=report_in.suspected_disease,
        severity=report_in.severity,
        water_source_used=report_in.water_source_used,
        notes=report_in.notes,
        status="PENDING"
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

@router.get("/reports", response_model=List[HealthReportOut])
def get_my_reports(village_name: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(HealthReport)
    if village_name:
        query = query.filter(HealthReport.village_name == village_name)
    return query.order_by(HealthReport.submitted_at.desc()).all()

@router.post("/predict-risk", response_model=PredictionOut)
def predict_disease_risk(req: PredictionRequest, db: Session = Depends(get_db)):
    res = predictor.predict(
        village_name=req.village_name,
        district_name=req.district_name,
        ph_level=req.ph_level,
        turbidity_ntu=req.turbidity_ntu,
        bacterial_cfu=req.bacterial_cfu,
        e_coli_presence=req.e_coli_presence,
        recent_symptom_cases_14d=req.recent_symptom_cases_14d,
        rainfall_mm_7d=req.rainfall_mm_7d,
        temperature_c=req.temperature_c,
        sanitation_index=req.sanitation_index
    )
    # Save prediction record
    db_pred = Prediction(
        village_name=req.village_name,
        district_name=req.district_name,
        predicted_disease=res["predicted_disease"],
        outbreak_probability=res["outbreak_probability"],
        risk_level=res["risk_level"],
        confidence_score=res["confidence_score"],
        explainable_factors=str(res["explainable_factors"]),
        preventive_recommendations=str(res["preventive_recommendations"])
    )
    db.add(db_pred)
    db.commit()
    return res

@router.get("/water-sources", response_model=List[WaterTestOut])
def get_water_sources(district_name: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(WaterTest)
    if district_name:
        query = query.filter(WaterTest.district_name == district_name)
    return query.all()

@router.get("/nearby-hospitals")
def get_nearby_hospitals(district_name: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Hospital)
    if district_name:
        query = query.filter(Hospital.district_name == district_name)
    return query.all()

@router.get("/alerts")
def get_public_alerts(db: Session = Depends(get_db)):
    return db.query(Notification).order_by(Notification.sent_at.desc()).all()
