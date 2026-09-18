import os
import sys
from datetime import datetime, timedelta

# Ensure parent directory is on sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, engine, Base
from app.models.models import (
    User, District, Village, HealthReport, WaterTest,
    DiseaseCase, Prediction, Notification, Hospital,
    MedicineInventory, AuditLog, UserRole, RiskLevel
)
from app.core.security import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).filter_list if hasattr(db.query(User), 'filter_list') else db.query(User).count() > 0:
        print("Database already contains data. Re-seeding fresh data...")
        db.query(AuditLog).delete()
        db.query(MedicineInventory).delete()
        db.query(Hospital).delete()
        db.query(Notification).delete()
        db.query(Prediction).delete()
        db.query(DiseaseCase).delete()
        db.query(WaterTest).delete()
        db.query(HealthReport).delete()
        db.query(Village).delete()
        db.query(District).delete()
        db.query(User).delete()
        db.commit()

    print("Seeding Users...")
    users_data = [
        {"full_name": "Ramesh Das", "email": "citizen@arogya.gov.in", "role": UserRole.CITIZEN.value, "state": "Assam", "district": "Kamrup Metropolitan", "village": "Dispur", "password": "citizen123"},
        {"full_name": "Anita Devi (ASHA)", "email": "asha@arogya.gov.in", "role": UserRole.ASHA_WORKER.value, "state": "Assam", "district": "Kamrup Metropolitan", "village": "Sonapur", "assigned_phc": "Sonapur Primary Health Centre", "password": "asha123"},
        {"full_name": "Dr. Prabal Das", "email": "phc@arogya.gov.in", "role": UserRole.PHC_STAFF.value, "state": "Assam", "district": "Kamrup Metropolitan", "village": "Sonapur", "assigned_phc": "Sonapur Primary Health Centre", "password": "phc123"},
        {"full_name": "Dr. Hemanta Gogoi (DHO)", "email": "dho@arogya.gov.in", "role": UserRole.DISTRICT_OFFICER.value, "state": "Assam", "district": "Kamrup Metropolitan", "password": "dho123"},
        {"full_name": "Shri J. K. Sharma (MDoNER Sec)", "email": "govt@arogya.gov.in", "role": UserRole.GOVT_ADMIN.value, "state": "Northeast Region", "password": "govt123"},
        {"full_name": "System Administrator", "email": "admin@arogya.gov.in", "role": UserRole.SYS_ADMIN.value, "state": "Assam", "password": "admin123"},
    ]

    for u in users_data:
        db_user = User(
            full_name=u["full_name"],
            email=u["email"],
            role=u["role"],
            state=u["state"],
            district=u.get("district"),
            village=u.get("village"),
            assigned_phc=u.get("assigned_phc"),
            hashed_password=get_password_hash(u["password"])
        )
        db.add(db_user)
    db.commit()

    print("Seeding Northeast India Districts & Villages...")
    districts_list = [
        {"name": "Kamrup Metropolitan", "state": "Assam", "lat": 26.1445, "lng": 91.7362, "pop": 1260000, "risk": 78.5, "outbreaks": 3},
        {"name": "Dibrugarh", "state": "Assam", "lat": 27.4728, "lng": 94.9120, "pop": 1326000, "risk": 64.2, "outbreaks": 2},
        {"name": "Cachar", "state": "Assam", "lat": 24.8333, "lng": 92.7789, "pop": 1736000, "risk": 82.1, "outbreaks": 4},
        {"name": "East Khasi Hills", "state": "Meghalaya", "lat": 25.5788, "lng": 91.8933, "pop": 825000, "risk": 42.0, "outbreaks": 1},
        {"name": "West Tripura", "state": "Tripura", "lat": 23.8315, "lng": 91.2868, "pop": 918000, "risk": 58.3, "outbreaks": 2},
        {"name": "Imphal East", "state": "Manipur", "lat": 24.8170, "lng": 93.9368, "pop": 456000, "risk": 69.0, "outbreaks": 2},
        {"name": "Kohima", "state": "Nagaland", "lat": 25.6751, "lng": 94.1086, "pop": 267000, "risk": 28.5, "outbreaks": 0},
        {"name": "Aizawl", "state": "Mizoram", "lat": 23.7271, "lng": 92.7176, "pop": 400000, "risk": 31.0, "outbreaks": 0},
        {"name": "Papum Pare", "state": "Arunachal Pradesh", "lat": 27.0844, "lng": 93.6053, "pop": 176000, "risk": 35.2, "outbreaks": 1},
        {"name": "East Sikkim", "state": "Sikkim", "lat": 27.3389, "lng": 88.6065, "pop": 283000, "risk": 18.0, "outbreaks": 0},
    ]

    district_objs = {}
    for d in districts_list:
        db_d = District(
            name=d["name"], state=d["state"], latitude=d["lat"], longitude=d["lng"],
            population=d["pop"], risk_index=d["risk"], active_outbreaks=d["outbreaks"]
        )
        db.add(db_d)
        db.flush()
        district_objs[d["name"]] = db_d.id

    villages_list = [
        {"name": "Sonapur", "district": "Kamrup Metropolitan", "state": "Assam", "lat": 26.1189, "lng": 91.9782, "pop": 4500, "water": "Brahmaputra Tributary Stream", "risk": "CRITICAL", "score": 86.4},
        {"name": "Chandrapur", "district": "Kamrup Metropolitan", "state": "Assam", "lat": 26.2300, "lng": 91.8900, "pop": 3200, "water": "Brahmaputra River Bank", "risk": "HIGH", "score": 74.2},
        {"name": "Dispur Village", "district": "Kamrup Metropolitan", "state": "Assam", "lat": 26.1400, "lng": 91.7900, "pop": 6800, "water": "Deep Hand Pump", "risk": "MEDIUM", "score": 38.0},
        {"name": "Chabua", "district": "Dibrugarh", "state": "Assam", "lat": 27.4800, "lng": 95.1700, "pop": 5100, "water": "Dibru River Stream", "risk": "HIGH", "score": 68.9},
        {"name": "Moranhat", "district": "Dibrugarh", "state": "Assam", "lat": 27.1800, "lng": 94.9300, "pop": 4100, "water": "Pond Reservoir", "risk": "MEDIUM", "score": 45.1},
        {"name": "Lakhipur", "district": "Cachar", "state": "Assam", "lat": 24.7900, "lng": 93.0100, "pop": 5900, "water": "Barak River Stream", "risk": "CRITICAL", "score": 89.2},
        {"name": "Sonai", "district": "Cachar", "state": "Assam", "lat": 24.7300, "lng": 92.8900, "pop": 4300, "water": "Sonai River", "risk": "HIGH", "score": 71.5},
        {"name": "Mawsynram Village", "district": "East Khasi Hills", "state": "Meghalaya", "lat": 25.2975, "lng": 91.5826, "pop": 2800, "water": "Mountain Cave Spring", "risk": "MEDIUM", "score": 41.2},
        {"name": "Sohra (Cherrapunji)", "district": "East Khasi Hills", "state": "Meghalaya", "lat": 25.2700, "lng": 91.7300, "pop": 3400, "water": "Rainfall Harvested Pond", "risk": "LOW", "score": 22.0},
        {"name": "Jirania", "district": "West Tripura", "state": "Tripura", "lat": 23.8200, "lng": 91.4300, "pop": 4700, "water": "Howrah River Stream", "risk": "HIGH", "score": 65.4},
        {"name": "Andro", "district": "Imphal East", "state": "Manipur", "lat": 24.7500, "lng": 94.0300, "pop": 3900, "water": "Imphal River Branch", "risk": "HIGH", "score": 69.8},
        {"name": "Khonoma", "district": "Kohima", "state": "Nagaland", "lat": 25.6400, "lng": 94.0200, "pop": 1900, "water": "Terrace Mountain Spring", "risk": "LOW", "score": 14.2},
        {"name": "Reiek", "district": "Aizawl", "state": "Mizoram", "lat": 23.6800, "lng": 92.6200, "pop": 2100, "water": "Tlawng River Stream", "risk": "LOW", "score": 19.5},
        {"name": "Doimukh", "district": "Papum Pare", "state": "Arunachal Pradesh", "lat": 27.1400, "lng": 93.7500, "pop": 3100, "water": "Dikrong River", "risk": "MEDIUM", "score": 36.8},
        {"name": "Ranipool", "district": "East Sikkim", "state": "Sikkim", "lat": 27.2800, "lng": 88.5900, "pop": 2500, "water": "Teesta Tributary", "risk": "LOW", "score": 12.1},
    ]

    for v in villages_list:
        db_v = Village(
            name=v["name"],
            district_id=district_objs.get(v["district"]),
            state=v["state"],
            latitude=v["lat"],
            longitude=v["lng"],
            population=v["pop"],
            primary_water_source=v["water"],
            risk_level=v["risk"],
            risk_score=v["score"]
        )
        db.add(db_v)
    db.commit()

    print("Seeding Water Quality Tests...")
    water_tests_data = [
        {"source": "Sonapur Stream (Brahmaputra Tributary)", "type": "River Stream", "village": "Sonapur", "district": "Kamrup Metropolitan", "lat": 26.1189, "lng": 91.9782, "ph": 5.8, "turb": 18.5, "cfu": 240, "ecoli": True, "do": 4.2, "score": 88.0, "safe": False},
        {"source": "Chandrapur Tube Well #3", "type": "Tube Well", "village": "Chandrapur", "district": "Kamrup Metropolitan", "lat": 26.2300, "lng": 91.8900, "ph": 6.2, "turb": 12.0, "cfu": 120, "ecoli": True, "do": 5.1, "score": 72.0, "safe": False},
        {"source": "Dispur Community Reservoir", "type": "Piped Tank", "village": "Dispur Village", "district": "Kamrup Metropolitan", "lat": 26.1400, "lng": 91.7900, "ph": 7.1, "turb": 3.2, "cfu": 15, "ecoli": False, "do": 6.8, "score": 18.0, "safe": True},
        {"source": "Lakhipur Barak River Intake", "type": "River Intake", "village": "Lakhipur", "district": "Cachar", "lat": 24.7900, "lng": 93.0100, "ph": 5.4, "turb": 24.0, "cfu": 380, "ecoli": True, "do": 3.8, "score": 94.0, "safe": False},
        {"source": "Jirania Howrah River Spot", "type": "River Stream", "village": "Jirania", "district": "West Tripura", "lat": 23.8200, "lng": 91.4300, "ph": 6.1, "turb": 14.5, "cfu": 160, "ecoli": True, "do": 4.9, "score": 68.0, "safe": False},
        {"source": "Andro Community Pond", "type": "Open Pond", "village": "Andro", "district": "Imphal East", "lat": 24.7500, "lng": 94.0300, "ph": 6.0, "turb": 16.2, "cfu": 190, "ecoli": True, "do": 4.5, "score": 74.0, "safe": False},
        {"source": "Khonoma Mountain Spring", "type": "Natural Spring", "village": "Khonoma", "district": "Kohima", "lat": 25.6400, "lng": 94.0200, "ph": 7.3, "turb": 1.1, "cfu": 2, "ecoli": False, "do": 7.8, "score": 5.0, "safe": True},
        {"source": "Mawsynram Cave Stream", "type": "Spring Water", "village": "Mawsynram Village", "district": "East Khasi Hills", "lat": 25.2975, "lng": 91.5826, "ph": 6.8, "turb": 4.5, "cfu": 35, "ecoli": False, "do": 6.5, "score": 28.0, "safe": True},
    ]

    for wt in water_tests_data:
        db_wt = WaterTest(
            water_source_name=wt["source"],
            water_source_type=wt["type"],
            village_name=wt["village"],
            district_name=wt["district"],
            state_name="Assam" if "Assam" in wt["district"] or wt["district"] in ["Kamrup Metropolitan", "Dibrugarh", "Cachar"] else "Northeast",
            latitude=wt["lat"],
            longitude=wt["lng"],
            ph_level=wt["ph"],
            turbidity_ntu=wt["turb"],
            bacterial_cfu=wt["cfu"],
            e_coli_presence=wt["ecoli"],
            dissolved_oxygen=wt["do"],
            contamination_score=wt["score"],
            is_safe=wt["safe"]
        )
        db.add(db_wt)
    db.commit()

    print("Seeding Disease Cases & Outbreak Alerts...")
    cases_data = [
        {"disease": "Cholera", "village": "Sonapur", "district": "Kamrup Metropolitan", "count": 14, "status": "ACTIVE"},
        {"disease": "Acute Diarrhoeal Diseases", "village": "Chandrapur", "district": "Kamrup Metropolitan", "count": 19, "status": "ACTIVE"},
        {"disease": "Typhoid Fever", "village": "Lakhipur", "district": "Cachar", "count": 22, "status": "CRITICAL"},
        {"disease": "Bacillary Dysentery", "village": "Sonai", "district": "Cachar", "count": 11, "status": "ACTIVE"},
        {"disease": "Hepatitis A", "village": "Jirania", "district": "West Tripura", "count": 8, "status": "ACTIVE"},
        {"disease": "Hepatitis E", "village": "Andro", "district": "Imphal East", "count": 12, "status": "ACTIVE"},
        {"disease": "Acute Diarrhoeal Diseases", "village": "Chabua", "district": "Dibrugarh", "count": 15, "status": "RECOVERED"},
    ]

    for c in cases_data:
        db_c = DiseaseCase(
            disease_name=c["disease"], village_name=c["village"], district_name=c["district"],
            state_name="Assam" if c["district"] in ["Kamrup Metropolitan", "Dibrugarh", "Cachar"] else "Northeast",
            count=c["count"], status=c["status"]
        )
        db.add(db_c)

    notifications_data = [
        {"title": "CRITICAL: Cholera Outbreak Alert - Sonapur Village", "message": "High E. Coli contamination (240 CFU/100ml) detected in river stream source. 14 active cholera cases reported in last 7 days.", "district": "Kamrup Metropolitan", "village": "Sonapur", "risk": "CRITICAL", "target": "ALL"},
        {"title": "HIGH RISK: Typhoid Surge - Lakhipur (Cachar)", "message": "Barak river intake turbidity measured at 24 NTU. Medical emergency team dispatched from Silchar Civil Hospital.", "district": "Cachar", "village": "Lakhipur", "risk": "HIGH", "target": "DHO"},
        {"title": "ADVISORY: Heavy Monsoonal Water Runoff Alert", "message": "All ASHA workers in East Khasi Hills and Kamrup Metro are instructed to distribute Halazone water purification tablets.", "district": "Kamrup Metropolitan", "village": "Chandrapur", "risk": "MEDIUM", "target": "ASHA"},
    ]

    for n in notifications_data:
        db_n = Notification(
            title=n["title"], message=n["message"], district_name=n["district"], village_name=n["village"], risk_level=n["risk"], target_role=n["target"]
        )
        db.add(db_n)

    print("Seeding Hospitals & Medicine Inventory...")
    hospitals_data = [
        {"name": "Sonapur Primary Health Centre (PHC)", "type": "PHC", "district": "Kamrup Metropolitan", "village": "Sonapur", "lat": 26.1190, "lng": 91.9790, "total": 40, "avail": 12, "iso": 8, "phone": "+91-361-2890123", "mo": "Dr. Prabal Das"},
        {"name": "Gauhati Medical College & Hospital (GMCH)", "type": "District Hospital", "district": "Kamrup Metropolitan", "village": "Guwahati", "lat": 26.1550, "lng": 91.7760, "total": 500, "avail": 120, "iso": 45, "phone": "+91-361-2529457", "mo": "Dr. A. C. Kataki"},
        {"name": "Silchar Civil Hospital & PHC", "type": "Civil Hospital", "district": "Cachar", "village": "Silchar", "lat": 24.8300, "lng": 92.7800, "total": 150, "avail": 32, "iso": 15, "phone": "+91-3842-234890", "mo": "Dr. R. K. Choudhury"},
        {"name": "Shillong Civil Hospital", "type": "District Hospital", "district": "East Khasi Hills", "village": "Shillong", "lat": 25.5700, "lng": 91.8900, "total": 200, "avail": 85, "iso": 20, "phone": "+91-364-2224100", "mo": "Dr. Lyngdoh"},
    ]

    for h in hospitals_data:
        db_h = Hospital(
            name=h["name"], facility_type=h["type"], district_name=h["district"], village_name=h["village"],
            latitude=h["lat"], longitude=h["lng"], total_beds=h["total"], available_beds=h["avail"],
            isolation_beds=h["iso"], contact_phone=h["phone"], medical_officer_incharge=h["mo"]
        )
        db.add(db_h)

    medicines_data = [
        {"hospital": "Sonapur Primary Health Centre (PHC)", "district": "Kamrup Metropolitan", "name": "ORS (Oral Rehydration Salts)", "stock": 1850, "unit": "Sachets", "status": "SUFFICIENT"},
        {"hospital": "Sonapur Primary Health Centre (PHC)", "district": "Kamrup Metropolitan", "name": "Zinc Sulfate Tablets 20mg", "stock": 940, "unit": "Tablets", "status": "SUFFICIENT"},
        {"hospital": "Sonapur Primary Health Centre (PHC)", "district": "Kamrup Metropolitan", "name": "Halazone Water Purification Tablets", "stock": 120, "unit": "Strips", "status": "LOW"},
        {"hospital": "Sonapur Primary Health Centre (PHC)", "district": "Kamrup Metropolitan", "name": "Azithromycin 500mg", "stock": 350, "unit": "Tablets", "status": "SUFFICIENT"},
        {"hospital": "Silchar Civil Hospital & PHC", "district": "Cachar", "name": "Oral Cholera Vaccine (Shanchol)", "stock": 85, "unit": "Doses", "status": "CRITICAL"},
        {"hospital": "Silchar Civil Hospital & PHC", "district": "Cachar", "name": "IV Fluids (Normal Saline 0.9%)", "stock": 420, "unit": "Bottles", "status": "SUFFICIENT"},
    ]

    for m in medicines_data:
        db_m = MedicineInventory(
            hospital_name=m["hospital"], district_name=m["district"], medicine_name=m["name"],
            stock_quantity=m["stock"], unit=m["unit"], status=m["status"]
        )
        db.add(db_m)

    db.commit()
    db.close()
    print("Database successfully seeded with authentic Northeast India surveillance dataset!")

if __name__ == "__main__":
    seed_database()
