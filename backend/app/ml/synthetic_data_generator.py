"""
Synthetic Outbreak Data Generator
Simulates a realistic timeline-based outbreak:
  Day 0-2: Heavy rainfall -> turbidity spikes
  Day 3-5: ASHA workers log symptom surge
  Day 6-7: AI detects cluster -> CRITICAL alert fires
"""

import json
import random
import math
from datetime import datetime, timedelta

def generate_outbreak_timeline(village: str = "Sonapur", days: int = 14) -> list[dict]:
    """Generate synthetic day-by-day outbreak timeline data."""
    base_date = datetime.utcnow() - timedelta(days=days)
    timeline = []

    for i in range(days + 1):
        date = base_date + timedelta(days=i)
        # Rainfall spikes day 3-5 (pre-monsoon flush)
        rainfall = 0.0
        if 3 <= i <= 5:
            rainfall = random.uniform(80, 140)
        elif 6 <= i <= 8:
            rainfall = random.uniform(40, 70)
        else:
            rainfall = random.uniform(0, 20)

        # Turbidity lags rainfall by 1 day
        turbidity = 0.0
        if 4 <= i <= 7:
            turbidity = random.uniform(16, 28)
        elif 2 <= i <= 3:
            turbidity = random.uniform(8, 15)
        else:
            turbidity = random.uniform(1.5, 5)

        # E. Coli spikes when turbidity is high
        e_coli = turbidity > 12

        # Symptom cases spike 2-3 days after water contamination
        if 6 <= i <= 10:
            symptom_cases = random.randint(8, 22)
        elif 4 <= i <= 5:
            symptom_cases = random.randint(3, 7)
        else:
            symptom_cases = random.randint(0, 2)

        # pH dips during flood runoff
        ph = random.uniform(5.4, 5.9) if 4 <= i <= 7 else random.uniform(6.8, 7.4)

        # Risk score
        risk_score = min(
            (turbidity * 1.8) + (symptom_cases * 4) + (35 if e_coli else 0) + (rainfall * 0.1), 98.5
        )
        risk_level = "CRITICAL" if risk_score >= 80 else ("HIGH" if risk_score >= 55 else ("MEDIUM" if risk_score >= 30 else "LOW"))

        # Alert fires at day 7
        alert_triggered = i >= 7 and risk_level in ["CRITICAL", "HIGH"]

        timeline.append({
            "day": i,
            "date": date.strftime("%d %b"),
            "village": village,
            "rainfall_mm": round(rainfall, 1),
            "turbidity_ntu": round(turbidity, 1),
            "ph_level": round(ph, 2),
            "e_coli": e_coli,
            "symptom_cases": symptom_cases,
            "risk_score": round(risk_score, 1),
            "risk_level": risk_level,
            "alert_triggered": alert_triggered
        })

    return timeline

def generate_water_quality_samples(n: int = 50) -> list[dict]:
    """Generate n synthetic water quality test records."""
    sources = [
        {"name": "Sonapur Stream Intake", "village": "Sonapur", "lat": 26.1189, "lng": 91.9782},
        {"name": "Lakhipur Barak River", "village": "Lakhipur", "lat": 24.7900, "lng": 93.0100},
        {"name": "Chandrapur Tube Well #3", "village": "Chandrapur", "lat": 26.2300, "lng": 91.8900},
        {"name": "Chabua Dibru Stream", "village": "Chabua", "lat": 27.4800, "lng": 95.1700},
        {"name": "Khonoma Mountain Spring", "village": "Khonoma", "lat": 25.6400, "lng": 94.0200},
    ]
    records = []
    for i in range(n):
        src = sources[i % len(sources)]
        contaminated = random.random() < 0.55
        records.append({
            "id": i + 1,
            "source_name": src["name"],
            "village": src["village"],
            "lat": src["lat"] + random.uniform(-0.02, 0.02),
            "lng": src["lng"] + random.uniform(-0.02, 0.02),
            "ph": round(random.uniform(5.3, 6.0) if contaminated else random.uniform(6.8, 7.5), 2),
            "turbidity_ntu": round(random.uniform(14, 30) if contaminated else random.uniform(1, 5), 1),
            "bacterial_cfu": round(random.uniform(150, 400) if contaminated else random.uniform(0, 20), 0),
            "e_coli": contaminated and random.random() < 0.75,
            "tds_ppm": round(random.uniform(800, 2000) if contaminated else random.uniform(100, 500), 0),
            "temperature_c": round(random.uniform(22, 32), 1),
            "is_safe": not contaminated,
            "contamination_score": round(random.uniform(65, 95) if contaminated else random.uniform(5, 25), 1),
            "tested_by": random.choice(["ASHA Worker Field Kit", "IoT Water Sensor", "PHC Lab Officer", "H2S Strip Test"]),
        })
    return records

def generate_village_risk_matrix() -> list[dict]:
    """Generate state-level risk matrix for all 8 NE states."""
    return [
        {"state": "Assam", "total_cases": 145, "active_cases": 38, "water_safety_score": 62.4, "risk_index": 78.5, "high_risk_villages": 18},
        {"state": "Meghalaya", "total_cases": 28, "active_cases": 7, "water_safety_score": 84.1, "risk_index": 42.0, "high_risk_villages": 4},
        {"state": "Tripura", "total_cases": 46, "active_cases": 14, "water_safety_score": 71.0, "risk_index": 58.3, "high_risk_villages": 6},
        {"state": "Manipur", "total_cases": 63, "active_cases": 21, "water_safety_score": 68.5, "risk_index": 69.0, "high_risk_villages": 9},
        {"state": "Nagaland", "total_cases": 14, "active_cases": 2, "water_safety_score": 88.2, "risk_index": 28.5, "high_risk_villages": 2},
        {"state": "Mizoram", "total_cases": 9, "active_cases": 1, "water_safety_score": 91.5, "risk_index": 31.0, "high_risk_villages": 1},
        {"state": "Arunachal Pradesh", "total_cases": 22, "active_cases": 6, "water_safety_score": 79.0, "risk_index": 35.2, "high_risk_villages": 5},
        {"state": "Sikkim", "total_cases": 4, "active_cases": 0, "water_safety_score": 94.8, "risk_index": 18.0, "high_risk_villages": 0},
    ]

if __name__ == "__main__":
    print("=== Outbreak Timeline Simulation (Sonapur Village) ===")
    timeline = generate_outbreak_timeline("Sonapur", 14)
    for row in timeline:
        flag = "🚨 ALERT" if row["alert_triggered"] else ""
        print(f"Day {row['day']:02d} | {row['date']} | Rain: {row['rainfall_mm']:5.1f}mm | Turbidity: {row['turbidity_ntu']:5.1f} NTU | Cases: {row['symptom_cases']:3d} | Risk: {row['risk_level']:8s} {flag}")
    
    print("\n=== Water Quality Samples (n=5) ===")
    samples = generate_water_quality_samples(5)
    for s in samples:
        print(f"{s['source_name']} | pH: {s['ph']} | Turbidity: {s['turbidity_ntu']} NTU | E.Coli: {s['e_coli']} | Safe: {s['is_safe']}")

    print("\n=== NE State Risk Matrix ===")
    matrix = generate_village_risk_matrix()
    for m in matrix:
        print(f"{m['state']:25s} | Active Cases: {m['active_cases']:3d} | Risk Index: {m['risk_index']:5.1f} | High Risk Villages: {m['high_risk_villages']}")
