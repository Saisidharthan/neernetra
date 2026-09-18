from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import District, Village, DiseaseCase, WaterTest, HealthReport
from datetime import datetime

router = APIRouter(prefix="/reports", tags=["Reports & Export"])

@router.get("/summary")
def get_report_summary(district_name: str = "Kamrup Metropolitan", db: Session = Depends(get_db)):
    district = db.query(District).filter(District.name == district_name).first()
    villages = db.query(Village).filter(Village.district_id == (district.id if district else 1)).all()
    water_tests = db.query(WaterTest).filter(WaterTest.district_name == district_name).all()
    cases = db.query(DiseaseCase).filter(DiseaseCase.district_name == district_name).all()
    reports = db.query(HealthReport).filter(HealthReport.district_name == district_name).all()

    return {
        "report_id": f"REP-MDoNER-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "generated_at": datetime.utcnow().strftime("%d %b %Y, %H:%M HRS IST"),
        "authority": "Ministry of Development of North Eastern Region (MDoNER)",
        "district_name": district_name,
        "state_name": district.state if district else "Assam",
        "district_risk_index": district.risk_index if district else 76.4,
        "monitored_villages": [v.name for v in villages],
        "total_health_complaints": len(reports),
        "water_samples_tested": len(water_tests),
        "unsafe_water_sources_count": len([w for w in water_tests if not w.is_safe]),
        "active_cases": sum(c.count for c in cases if c.status == "ACTIVE"),
        "executive_summary": f"Surveillance report for {district_name}. High water turbidity and E. Coli bacterial presence observed in river intake sites. Immediate chlorination and ORS distribution recommended."
    }
