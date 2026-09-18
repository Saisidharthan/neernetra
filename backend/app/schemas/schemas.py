from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "CITIZEN"
    state: str = "Assam"
    district: Optional[str] = "Kamrup Metropolitan"
    village: Optional[str] = "Dispur"
    assigned_phc: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    state: str
    district: Optional[str]
    village: Optional[str]
    assigned_phc: Optional[str]

    class Config:
        from_attributes = True

# Health Report Schemas
class HealthReportCreate(BaseModel):
    patient_name: Optional[str] = "Anonymous Citizen"
    patient_age: Optional[int] = 30
    patient_gender: Optional[str] = "Other"
    village_name: str
    district_name: str
    state_name: str = "Assam"
    symptoms: str
    suspected_disease: Optional[str] = "Acute Diarrhoeal Diseases"
    severity: Optional[str] = "Moderate"
    water_source_used: Optional[str] = "River/Stream"
    notes: Optional[str] = None

class HealthReportOut(BaseModel):
    id: int
    reporter_role: str
    patient_name: Optional[str]
    patient_age: Optional[int]
    patient_gender: Optional[str]
    village_name: str
    district_name: str
    state_name: str
    symptoms: str
    suspected_disease: str
    severity: str
    water_source_used: Optional[str]
    status: str
    submitted_at: datetime

    class Config:
        from_attributes = True

# Water Test Schemas
class WaterTestCreate(BaseModel):
    water_source_name: str
    water_source_type: str = "River/Stream"
    village_name: str
    district_name: str
    state_name: str = "Assam"
    latitude: float
    longitude: float
    ph_level: float
    turbidity_ntu: float
    bacterial_cfu: float
    e_coli_presence: bool = False
    dissolved_oxygen: float = 6.5

class WaterTestOut(BaseModel):
    id: int
    water_source_name: str
    water_source_type: str
    village_name: str
    district_name: str
    state_name: str
    latitude: float
    longitude: float
    ph_level: float
    turbidity_ntu: float
    bacterial_cfu: float
    e_coli_presence: bool
    dissolved_oxygen: float
    contamination_score: float
    is_safe: bool
    tested_by: str
    test_date: datetime

    class Config:
        from_attributes = True

# AI Prediction Request
class PredictionRequest(BaseModel):
    village_name: str
    district_name: str
    ph_level: float
    turbidity_ntu: float
    bacterial_cfu: float
    e_coli_presence: bool
    recent_symptom_cases_14d: int = 5
    rainfall_mm_7d: float = 85.0
    temperature_c: float = 28.5
    sanitation_index: float = 45.0  # 0 to 100

class PredictionOut(BaseModel):
    village_name: str
    district_name: str
    predicted_disease: str
    outbreak_probability: float
    risk_level: str
    confidence_score: float
    explainable_factors: List[dict]
    preventive_recommendations: List[str]
