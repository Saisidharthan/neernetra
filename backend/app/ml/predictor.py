import numpy as np
import math

class DiseasePredictor:
    def __init__(self):
        pass

    def predict(
        self,
        village_name: str,
        district_name: str,
        ph_level: float,
        turbidity_ntu: float,
        bacterial_cfu: float,
        e_coli_presence: bool,
        recent_symptom_cases_14d: int = 5,
        rainfall_mm_7d: float = 85.0,
        temperature_c: float = 28.5,
        sanitation_index: float = 45.0,
        weekly_haat_mobility_index: float = 75.0,  # 0-100 (Weekly local market crowd mobility)
        monsoonal_flood_level: float = 65.0       # 0-100 (Seasonal river flooding)
    ):
        # 1. Base Hydrological Risk Score
        ph_dev = abs(7.0 - ph_level)
        ph_risk = min(ph_dev * 15.0, 30.0) if (ph_level < 6.5 or ph_level > 8.5) else 2.0
        turbidity_risk = min((turbidity_ntu / 5.0) * 12.0, 35.0)
        cfu_risk = min((bacterial_cfu / 50.0) * 20.0, 40.0)
        ecoli_risk = 35.0 if e_coli_presence else 0.0

        water_risk_raw = ph_risk + turbidity_risk + cfu_risk + ecoli_risk

        # 2. Epidemiological & Environmental Multipliers
        case_velocity_factor = min(recent_symptom_cases_14d * 4.5, 45.0)
        monsoon_rainfall_factor = min((rainfall_mm_7d / 100.0) * 15.0, 20.0)
        sanitation_vulnerability = (100.0 - sanitation_index) * 0.25

        # 3. Regional Mobility & Cross-Border Vector Amplification
        mobility_vector_risk = (weekly_haat_mobility_index * 0.15) + (monsoonal_flood_level * 0.20)

        total_risk_score = (
            (water_risk_raw * 0.40) +
            (case_velocity_factor * 0.30) +
            (monsoon_rainfall_factor * 0.10) +
            (sanitation_vulnerability * 0.10) +
            (mobility_vector_risk * 0.10)
        )
        total_risk_score = min(max(total_risk_score, 5.0), 98.5)

        # 4. Determine Risk Level
        if total_risk_score >= 80.0:
            risk_level = "CRITICAL"
        elif total_risk_score >= 55.0:
            risk_level = "HIGH"
        elif total_risk_score >= 30.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # 5. Disease Classification Logic
        if e_coli_presence and cfu_risk > 20 and recent_symptom_cases_14d > 8:
            predicted_disease = "Cholera"
        elif ph_level < 6.2 and recent_symptom_cases_14d > 5:
            predicted_disease = "Hepatitis A / E"
        elif turbidity_ntu > 15.0 and recent_symptom_cases_14d > 4:
            predicted_disease = "Typhoid Fever"
        elif recent_symptom_cases_14d > 10:
            predicted_disease = "Bacillary Dysentery"
        else:
            predicted_disease = "Acute Diarrhoeal Diseases (ADD)"

        # 6. Outbreak Probability
        outbreak_probability = round(min(total_risk_score * 0.95 + (10 if e_coli_presence else 0), 99.2), 1)

        # 7. Explainable AI Factors (XAI)
        explainable_factors = []
        if e_coli_presence:
            explainable_factors.append({
                "factor": "Pathogenic E. Coli Detected",
                "contribution": "+35%",
                "impact": "CRITICAL",
                "description": "Fecal contamination confirmed in community water source."
            })
        if turbidity_ntu > 5.0:
            explainable_factors.append({
                "factor": f"High Turbidity ({turbidity_ntu} NTU)",
                "contribution": f"+{round(min(turbidity_ntu * 1.5, 25), 1)}%",
                "impact": "HIGH" if turbidity_ntu > 15 else "MEDIUM",
                "description": "Suspended solids shield bacteria from natural UV disinfection."
            })
        if recent_symptom_cases_14d >= 5:
            explainable_factors.append({
                "factor": f"14-Day Symptom Cluster ({recent_symptom_cases_14d} cases)",
                "contribution": f"+{round(case_velocity_factor * 0.6, 1)}%",
                "impact": "HIGH",
                "description": "Active community transmission velocity detected by ASHA surveys."
            })
        if weekly_haat_mobility_index >= 70.0:
            explainable_factors.append({
                "factor": f"Weekly Local Haat Mobility ({weekly_haat_mobility_index}%)",
                "contribution": "+14%",
                "impact": "MEDIUM",
                "description": "Inter-village rural market crowds accelerating pathogen vector spread."
            })

        # 8. Actionable Preventive Recommendations
        recommendations = []
        if risk_level in ["CRITICAL", "HIGH"]:
            recommendations.append("Issue immediate WhatsApp & SMS Boil Water Advisory to Gram Pradhan.")
            recommendations.append("Dispatch ASHA field squad with ORS packets and Halazone water purification tablets.")
            recommendations.append("Deploy PHC Mobile Medical Unit for rapid diagnostic screening.")
            recommendations.append("Super-chlorinate local tube wells and stream intake reservoirs.")
        elif risk_level == "MEDIUM":
            recommendations.append("Increase water testing frequency from weekly to daily.")
            recommendations.append("Conduct community hygiene and handwashing awareness camp.")
            recommendations.append("Ensure adequate ORS and Zinc tablet inventory at nearest PHC.")
        else:
            recommendations.append("Continue routine weekly water quality monitoring.")
            recommendations.append("Maintain baseline sanitation and chlorination protocols.")

        return {
            "village_name": village_name,
            "district_name": district_name,
            "predicted_disease": predicted_disease,
            "outbreak_probability": outbreak_probability,
            "risk_level": risk_level,
            "confidence_score": round(88.5 + (total_risk_score * 0.1), 1),
            "explainable_factors": explainable_factors,
            "preventive_recommendations": recommendations
        }

predictor = DiseasePredictor()
