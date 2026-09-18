from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import District, Village, DiseaseCase, WaterTest

router = APIRouter(prefix="/gov-analytics", tags=["Government & MDoNER Analytics"])

@router.get("/macro-overview")
def get_state_macro_overview(db: Session = Depends(get_db)):
    districts = db.query(District).all()
    villages = db.query(Village).all()
    water_tests = db.query(WaterTest).all()
    cases = db.query(DiseaseCase).all()

    total_population_monitored = sum(d.population for d in districts)
    total_active_outbreaks = sum(d.active_outbreaks for d in districts)

    # State level risk index
    state_breakdown = [
        {"state": "Assam", "districts": 35, "high_risk_villages": 18, "water_safety_index": 62.4, "cases_this_month": 142},
        {"state": "Meghalaya", "districts": 12, "high_risk_villages": 4, "water_safety_index": 84.1, "cases_this_month": 28},
        {"state": "Tripura", "districts": 8, "high_risk_villages": 6, "water_safety_index": 71.0, "cases_this_month": 45},
        {"state": "Manipur", "districts": 16, "high_risk_villages": 9, "water_safety_index": 68.5, "cases_this_month": 62},
        {"state": "Nagaland", "districts": 16, "high_risk_villages": 2, "water_safety_index": 88.2, "cases_this_month": 14},
        {"state": "Mizoram", "districts": 11, "high_risk_villages": 1, "water_safety_index": 91.5, "cases_this_month": 9},
        {"state": "Arunachal Pradesh", "districts": 26, "high_risk_villages": 5, "water_safety_index": 79.0, "cases_this_month": 22},
        {"state": "Sikkim", "districts": 6, "high_risk_villages": 0, "water_safety_index": 94.8, "cases_this_month": 4},
    ]

    seasonal_disease_trend = [
        {"month": "Jan", "Cholera": 12, "Typhoid": 24, "Dysentery": 18, "ADD": 85},
        {"month": "Feb", "Cholera": 8, "Typhoid": 19, "Dysentery": 14, "ADD": 70},
        {"month": "Mar", "Cholera": 15, "Typhoid": 28, "Dysentery": 22, "ADD": 92},
        {"month": "Apr", "Cholera": 29, "Typhoid": 42, "Dysentery": 35, "ADD": 140},
        {"month": "May (Monsoon Start)", "Cholera": 68, "Typhoid": 84, "Dysentery": 62, "ADD": 280},
        {"month": "Jun (Peak Floods)", "Cholera": 145, "Typhoid": 162, "Dysentery": 120, "ADD": 450},
        {"month": "Jul", "Cholera": 132, "Typhoid": 148, "Dysentery": 105, "ADD": 410},
        {"month": "Aug", "Cholera": 98, "Typhoid": 115, "Dysentery": 84, "ADD": 320},
    ]

    return {
        "total_population_monitored": total_population_monitored,
        "active_outbreak_zones": total_active_outbreaks,
        "monitored_districts_count": len(districts),
        "monitored_villages_count": len(villages),
        "state_breakdown": state_breakdown,
        "seasonal_disease_trend": seasonal_disease_trend,
        "budget_allocated_inr_cr": 48.5,
        "water_purification_kits_deployed": 14500
    }
