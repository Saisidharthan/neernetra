export type UserRole = 
  | 'CITIZEN' 
  | 'ASHA_WORKER' 
  | 'PHC_STAFF' 
  | 'DISTRICT_OFFICER' 
  | 'GOVT_ADMIN' 
  | 'SYS_ADMIN';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  state: string;
  district?: string;
  village?: string;
  assigned_phc?: string;
}

export interface HealthReport {
  id: number;
  reporter_role: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  village_name: string;
  district_name: string;
  state_name: string;
  symptoms: string;
  suspected_disease: string;
  severity: string;
  water_source_used?: string;
  notes?: string;
  status: string;
  submitted_at: string;
}

export interface WaterTest {
  id: number;
  water_source_name: string;
  water_source_type: string;
  village_name: string;
  district_name: string;
  state_name: string;
  latitude: number;
  longitude: number;
  ph_level: number;
  turbidity_ntu: number;
  bacterial_cfu: number;
  e_coli_presence: boolean;
  dissolved_oxygen: number;
  contamination_score: number;
  is_safe: boolean;
  tested_by: string;
  test_date: string;
}

export interface PredictionResult {
  village_name: string;
  district_name: string;
  predicted_disease: string;
  outbreak_probability: number;
  risk_level: RiskLevel;
  confidence_score: number;
  explainable_factors: Array<{
    factor: string;
    contribution: string;
    impact: string;
    description: string;
  }>;
  preventive_recommendations: string[];
}

export interface DistrictMetric {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  population: number;
  risk_index: number;
  active_outbreaks: number;
}

export interface VillageMetric {
  id: number;
  name: string;
  district_id: number;
  state: string;
  latitude: number;
  longitude: number;
  population: number;
  primary_water_source: string;
  risk_level: RiskLevel;
  risk_score: number;
}

export interface Hospital {
  id: number;
  name: string;
  facility_type: string;
  district_name: string;
  village_name?: string;
  latitude: number;
  longitude: number;
  total_beds: number;
  available_beds: number;
  isolation_beds: number;
  contact_phone: string;
  medical_officer_incharge: string;
}

export interface MedicineItem {
  id: number;
  hospital_name: string;
  district_name: string;
  medicine_name: string;
  stock_quantity: number;
  unit: string;
  status: 'SUFFICIENT' | 'LOW' | 'CRITICAL';
}

export interface NotificationAlert {
  id: number;
  title: string;
  message: string;
  district_name?: string;
  village_name?: string;
  risk_level: RiskLevel;
  target_role: string;
  sent_at: string;
}
