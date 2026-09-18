import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class UserRole(str, enum.Enum):
    CITIZEN = "CITIZEN"
    ASHA_WORKER = "ASHA_WORKER"
    PHC_STAFF = "PHC_STAFF"
    DISTRICT_OFFICER = "DISTRICT_OFFICER"
    GOVT_ADMIN = "GOVT_ADMIN"
    SYS_ADMIN = "SYS_ADMIN"


class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.CITIZEN.value, nullable=False)
    state = Column(String, default="Assam", nullable=False)
    district = Column(String, nullable=True)
    village = Column(String, nullable=True)
    assigned_phc = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    state = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    population = Column(Integer, default=0)
    risk_index = Column(Float, default=0.0)
    active_outbreaks = Column(Integer, default=0)

    villages = relationship("Village", back_populates="district")


class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    state = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    population = Column(Integer, default=0)
    primary_water_source = Column(String, nullable=True)
    risk_level = Column(String, default=RiskLevel.LOW.value)
    risk_score = Column(Float, default=0.0)

    district = relationship("District", back_populates="villages")


class HealthReport(Base):
    __tablename__ = "health_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_role = Column(String, default=UserRole.CITIZEN.value, nullable=False)
    patient_name = Column(String, nullable=True)
    patient_age = Column(Integer, nullable=True)
    patient_gender = Column(String, nullable=True)
    village_name = Column(String, index=True, nullable=False)
    district_name = Column(String, index=True, nullable=False)
    state_name = Column(String, default="Assam", nullable=False)
    symptoms = Column(Text, nullable=False)
    suspected_disease = Column(String, default="Acute Diarrhoeal Diseases", nullable=False)
    severity = Column(String, default="Moderate", nullable=False)
    water_source_used = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="PENDING", nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class WaterTest(Base):
    __tablename__ = "water_tests"

    id = Column(Integer, primary_key=True, index=True)
    water_source_name = Column(String, nullable=False)
    water_source_type = Column(String, default="River/Stream", nullable=False)
    village_name = Column(String, index=True, nullable=False)
    district_name = Column(String, index=True, nullable=False)
    state_name = Column(String, default="Assam", nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    ph_level = Column(Float, nullable=False)
    turbidity_ntu = Column(Float, nullable=False)
    bacterial_cfu = Column(Float, nullable=False)
    e_coli_presence = Column(Boolean, default=False, nullable=False)
    dissolved_oxygen = Column(Float, default=6.5, nullable=False)
    contamination_score = Column(Float, default=0.0, nullable=False)
    is_safe = Column(Boolean, default=True, nullable=False)
    tested_by = Column(String, default="District Water Testing Laboratory", nullable=False)
    test_date = Column(DateTime, default=datetime.utcnow, nullable=False)


class DiseaseCase(Base):
    __tablename__ = "disease_cases"

    id = Column(Integer, primary_key=True, index=True)
    disease_name = Column(String, nullable=False)
    village_name = Column(String, index=True, nullable=False)
    district_name = Column(String, index=True, nullable=False)
    state_name = Column(String, default="Assam", nullable=False)
    count = Column(Integer, default=0, nullable=False)
    status = Column(String, default="ACTIVE", nullable=False)
    reported_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    village_name = Column(String, index=True, nullable=False)
    district_name = Column(String, nullable=False)
    predicted_disease = Column(String, nullable=False)
    outbreak_probability = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    confidence_score = Column(Float, nullable=False)
    explainable_factors = Column(Text, nullable=True)
    preventive_recommendations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    district_name = Column(String, nullable=True)
    village_name = Column(String, nullable=True)
    risk_level = Column(String, default=RiskLevel.HIGH.value, nullable=False)
    target_role = Column(String, default="ALL", nullable=False)
    is_read = Column(Boolean, default=False)
    sent_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    facility_type = Column(String, nullable=False)
    district_name = Column(String, index=True, nullable=False)
    village_name = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    total_beds = Column(Integer, default=0)
    available_beds = Column(Integer, default=0)
    isolation_beds = Column(Integer, default=0)
    contact_phone = Column(String, nullable=True)
    medical_officer_incharge = Column(String, nullable=True)


class MedicineInventory(Base):
    __tablename__ = "medicine_inventory"

    id = Column(Integer, primary_key=True, index=True)
    hospital_name = Column(String, nullable=False)
    district_name = Column(String, index=True, nullable=False)
    medicine_name = Column(String, nullable=False)
    stock_quantity = Column(Integer, default=0)
    unit = Column(String, nullable=False)
    status = Column(String, default="SUFFICIENT", nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
