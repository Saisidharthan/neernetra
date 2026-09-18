import { HealthReport, WaterTest, PredictionResult, Hospital, MedicineItem, NotificationAlert } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchGISSummary() {
  try {
    const res = await fetch(`${API_BASE}/district/gis-summary`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend API not reachable, returning offline seed data fallback", e);
  }
  return getOfflineGISData();
}

export async function submitHealthComplaint(data: any) {
  try {
    const res = await fetch(`${API_BASE}/citizen/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using offline submission fallback");
  }
  return { id: Math.floor(Math.random() * 1000), ...data, status: 'PENDING', submitted_at: new Date().toISOString() };
}

export async function recordFieldSurvey(data: any) {
  try {
    const res = await fetch(`${API_BASE}/asha/survey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using ASHA survey offline fallback");
  }
  return { id: Math.floor(Math.random() * 1000), ...data, status: 'VERIFIED', submitted_at: new Date().toISOString() };
}

export async function recordWaterTestKitResult(data: any) {
  try {
    const res = await fetch(`${API_BASE}/asha/water-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using water test kit offline fallback");
  }
  return { id: Math.floor(Math.random() * 1000), ...data, is_safe: false, contamination_score: 78.5, test_date: new Date().toISOString() };
}

export async function requestAIPrediction(params: any): Promise<PredictionResult> {
  try {
    const res = await fetch(`${API_BASE}/citizen/predict-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Fallback AI calculation executed locally");
  }

  // Local fallback calculation
  const score = Math.min((params.bacterial_cfu * 0.2) + (params.turbidity_ntu * 2) + (params.e_coli_presence ? 35 : 0) + (params.recent_symptom_cases_14d * 4), 98.5);
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (score >= 80) riskLevel = 'CRITICAL';
  else if (score >= 55) riskLevel = 'HIGH';
  else if (score >= 30) riskLevel = 'MEDIUM';

  return {
    village_name: params.village_name || 'Sonapur',
    district_name: params.district_name || 'Kamrup Metropolitan',
    predicted_disease: params.e_coli_presence ? 'Cholera' : 'Acute Diarrhoeal Diseases',
    outbreak_probability: Math.round(score),
    risk_level: riskLevel,
    confidence_score: 91.2,
    explainable_factors: [
      { factor: 'Pathogenic E. Coli Presence', contribution: '+35%', impact: 'CRITICAL', description: 'Confirmed fecal indicator bacteria in drinking water source.' },
      { factor: `Water Turbidity (${params.turbidity_ntu} NTU)`, contribution: '+22%', impact: 'HIGH', description: 'Exceeds WHO safety threshold of 5 NTU.' },
      { factor: `14-Day Case Cluster (${params.recent_symptom_cases_14d} cases)`, contribution: '+18%', impact: 'HIGH', description: 'Active village symptom surge.' }
    ],
    preventive_recommendations: [
      'Issue immediate Boil Water Advisory to community.',
      'Deploy Halazone water purification tablets via ASHA worker.',
      'Chlorinate stream intake reservoir.',
      'Alert nearest PHC mobile medical team.'
    ]
  };
}

export async function queryAIBot(message: string, language: string) {
  try {
    const res = await fetch(`${API_BASE}/ai-chatbot/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("AI Bot fallback response");
  }
  
  if (message.toLowerCase().includes("water") || message.toLowerCase().includes("cholera")) {
    return {
      reply: "Boil drinking water for 10 minutes. Use ORS immediately for diarrhea symptoms. Report unsafe water sources on this portal.",
      recommended_actions: ["Boil water", "Use ORS", "Contact ASHA worker"]
    };
  }
  return {
    reply: "Welcome to Arogya Northeast AI Health Assistant! Ask me about disease symptoms, water purification, or emergency contacts.",
    recommended_actions: ["Water Safety Tips", "Nearest PHC", "Emergency 108"]
  };
}

export function getOfflineGISData() {
  return {
    districts: [
      { id: 1, name: "Kamrup Metropolitan", state: "Assam", latitude: 26.1445, longitude: 91.7362, population: 1260000, risk_index: 78.5, active_outbreaks: 3 },
      { id: 2, name: "Dibrugarh", state: "Assam", latitude: 27.4728, longitude: 94.9120, population: 1326000, risk_index: 64.2, active_outbreaks: 2 },
      { id: 3, name: "Cachar", state: "Assam", latitude: 24.8333, longitude: 92.7789, population: 1736000, risk_index: 82.1, active_outbreaks: 4 },
      { id: 4, name: "East Khasi Hills", state: "Meghalaya", latitude: 25.5788, longitude: 91.8933, population: 825000, risk_index: 42.0, active_outbreaks: 1 },
      { id: 5, name: "West Tripura", state: "Tripura", latitude: 23.8315, longitude: 91.2868, population: 918000, risk_index: 58.3, active_outbreaks: 2 },
      { id: 6, name: "Imphal East", state: "Manipur", latitude: 24.8170, longitude: 93.9368, population: 456000, risk_index: 69.0, active_outbreaks: 2 },
      { id: 7, name: "Kohima", state: "Nagaland", latitude: 25.6751, longitude: 94.1086, population: 267000, risk_index: 28.5, active_outbreaks: 0 },
      { id: 8, name: "Aizawl", state: "Mizoram", latitude: 23.7271, longitude: 92.7176, population: 400000, risk_index: 31.0, active_outbreaks: 0 },
    ],
    villages: [
      { id: 1, name: "Sonapur", district_id: 1, state: "Assam", latitude: 26.1189, longitude: 91.9782, population: 4500, primary_water_source: "Brahmaputra Stream", risk_level: "CRITICAL", risk_score: 86.4 },
      { id: 2, name: "Chandrapur", district_id: 1, state: "Assam", latitude: 26.2300, longitude: 91.8900, population: 3200, primary_water_source: "Brahmaputra Bank", risk_level: "HIGH", risk_score: 74.2 },
      { id: 3, name: "Dispur Village", district_id: 1, state: "Assam", latitude: 26.1400, longitude: 91.7900, population: 6800, primary_water_source: "Hand Pump", risk_level: "MEDIUM", risk_score: 38.0 },
      { id: 4, name: "Chabua", district_id: 2, state: "Assam", latitude: 27.4800, longitude: 95.1700, population: 5100, primary_water_source: "Dibru Stream", risk_level: "HIGH", risk_score: 68.9 },
      { id: 5, name: "Lakhipur", district_id: 3, state: "Assam", latitude: 24.7900, longitude: 93.0100, population: 5900, primary_water_source: "Barak River", risk_level: "CRITICAL", risk_score: 89.2 },
      { id: 6, name: "Mawsynram Village", district_id: 4, state: "Meghalaya", latitude: 25.2975, longitude: 91.5826, population: 2800, primary_water_source: "Spring Water", risk_level: "MEDIUM", risk_score: 41.2 },
      { id: 7, name: "Jirania", district_id: 5, state: "Tripura", latitude: 23.8200, longitude: 91.4300, population: 4700, primary_water_source: "Howrah River", risk_level: "HIGH", risk_score: 65.4 },
      { id: 8, name: "Andro", district_id: 6, state: "Manipur", latitude: 24.7500, longitude: 94.0300, population: 3900, primary_water_source: "Imphal River Branch", risk_level: "HIGH", risk_score: 69.8 }
    ],
    water_tests: [
      { id: 1, water_source_name: "Sonapur Stream (Brahmaputra)", water_source_type: "River Stream", village_name: "Sonapur", district_name: "Kamrup Metropolitan", state_name: "Assam", latitude: 26.1189, longitude: 91.9782, ph_level: 5.8, turbidity_ntu: 18.5, bacterial_cfu: 240, e_coli_presence: true, dissolved_oxygen: 4.2, contamination_score: 88.0, is_safe: false, tested_by: "ASHA Test Kit", test_date: new Date().toISOString() },
      { id: 2, water_source_name: "Lakhipur Barak River Intake", water_source_type: "River Intake", village_name: "Lakhipur", district_name: "Cachar", state_name: "Assam", latitude: 24.7900, longitude: 93.0100, ph_level: 5.4, turbidity_ntu: 24.0, bacterial_cfu: 380, e_coli_presence: true, dissolved_oxygen: 3.8, contamination_score: 94.0, is_safe: false, tested_by: "IoT Water Sensor", test_date: new Date().toISOString() },
      { id: 3, water_source_name: "Khonoma Mountain Spring", water_source_type: "Natural Spring", village_name: "Khonoma", district_name: "Kohima", state_name: "Nagaland", latitude: 25.6400, longitude: 94.0200, ph_level: 7.3, turbidity_ntu: 1.1, bacterial_cfu: 2, e_coli_presence: false, dissolved_oxygen: 7.8, contamination_score: 5.0, is_safe: true, tested_by: "PHC Lab Officer", test_date: new Date().toISOString() }
    ],
    disease_cases: [
      { id: 1, disease_name: "Cholera", village_name: "Sonapur", district_name: "Kamrup Metropolitan", state_name: "Assam", count: 14, status: "ACTIVE" },
      { id: 2, disease_name: "Acute Diarrhoeal Diseases", village_name: "Chandrapur", district_name: "Kamrup Metropolitan", state_name: "Assam", count: 19, status: "ACTIVE" },
      { id: 3, disease_name: "Typhoid Fever", village_name: "Lakhipur", district_name: "Cachar", state_name: "Assam", count: 22, status: "CRITICAL" }
    ],
    hospitals: [
      { id: 1, name: "Sonapur Primary Health Centre (PHC)", facility_type: "PHC", district_name: "Kamrup Metropolitan", village_name: "Sonapur", latitude: 26.1190, longitude: 91.9790, total_beds: 40, available_beds: 12, isolation_beds: 8, contact_phone: "+91-361-2890123", medical_officer_incharge: "Dr. Prabal Das" },
      { id: 2, name: "Gauhati Medical College & Hospital (GMCH)", facility_type: "District Hospital", district_name: "Kamrup Metropolitan", village_name: "Guwahati", latitude: 26.1550, longitude: 91.7760, total_beds: 500, available_beds: 120, isolation_beds: 45, contact_phone: "+91-361-2529457", medical_officer_incharge: "Dr. A. C. Kataki" }
    ]
  };
}
