from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.models import HealthReport, WaterTest, MedicineInventory, Village
from app.schemas.schemas import HealthReportCreate, HealthReportOut, WaterTestCreate, WaterTestOut

router = APIRouter(prefix="/asha", tags=["ASHA Worker Portal"])

@router.post("/survey", response_model=HealthReportOut)
def record_field_survey(survey: HealthReportCreate, db: Session = Depends(get_db)):
    db_report = HealthReport(
        reporter_role="ASHA_WORKER",
        patient_name=survey.patient_name,
        patient_age=survey.patient_age,
        patient_gender=survey.patient_gender,
        village_name=survey.village_name,
        district_name=survey.district_name,
        state_name=survey.state_name,
        symptoms=survey.symptoms,
        suspected_disease=survey.suspected_disease,
        severity=survey.severity,
        water_source_used=survey.water_source_used,
        notes=survey.notes,
        status="VERIFIED"
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

@router.post("/water-test", response_model=WaterTestOut)
def record_water_test_kit_result(wt_in: WaterTestCreate, db: Session = Depends(get_db)):
    ph_dev = abs(7.0 - wt_in.ph_level)
    turb_val = wt_in.turbidity_ntu
    cfu_val = wt_in.bacterial_cfu
    ecoli_val = 30.0 if wt_in.e_coli_presence else 0.0

    score = min((ph_dev * 10) + (turb_val * 2) + (cfu_val * 0.2) + ecoli_val, 100.0)
    is_safe = (score < 45.0) and not wt_in.e_coli_presence

    db_wt = WaterTest(
        water_source_name=wt_in.water_source_name,
        water_source_type=wt_in.water_source_type,
        village_name=wt_in.village_name,
        district_name=wt_in.district_name,
        state_name=wt_in.state_name,
        latitude=wt_in.latitude,
        longitude=wt_in.longitude,
        ph_level=wt_in.ph_level,
        turbidity_ntu=wt_in.turbidity_ntu,
        bacterial_cfu=wt_in.bacterial_cfu,
        e_coli_presence=wt_in.e_coli_presence,
        dissolved_oxygen=wt_in.dissolved_oxygen,
        contamination_score=round(score, 1),
        is_safe=is_safe,
        tested_by="ASHA Worker Field Test Kit"
    )
    db.add(db_wt)
    db.commit()
    db.refresh(db_wt)
    return db_wt

@router.post("/sync-offline-batch")
def sync_offline_batch(reports: List[HealthReportCreate], db: Session = Depends(get_db)):
    synced_count = 0
    for r in reports:
        db_rep = HealthReport(
            reporter_role="ASHA_WORKER",
            patient_name=r.patient_name,
            patient_age=r.patient_age,
            patient_gender=r.patient_gender,
            village_name=r.village_name,
            district_name=r.district_name,
            state_name=r.state_name,
            symptoms=r.symptoms,
            suspected_disease=r.suspected_disease,
            severity=r.severity,
            water_source_used=r.water_source_used,
            notes=f"[Offline Synced] {r.notes or ''}",
            status="VERIFIED"
        )
        db.add(db_rep)
        synced_count += 1
    db.commit()
    return {"message": f"Successfully synced {synced_count} offline field survey reports to Central Health Registry."}

@router.get("/medicine-inventory")
def get_phc_medicine_inventory(district_name: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(MedicineInventory)
    if district_name:
        query = query.filter(MedicineInventory.district_name == district_name)
    return query.all()
