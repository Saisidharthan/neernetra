TIERS = ["normal", "watch", "warning", "outbreak"]
TIER_ORDER = {t: k for k, t in enumerate(TIERS)}
ANOMALY_NTU = 10.0


def tier_for(risk: float, threshold: float, ears_flagged: bool, cases_3d: int, outbreak_cases_3d: int, water_anomaly: bool) -> str:
    if (ears_flagged and risk >= threshold) or cases_3d >= outbreak_cases_3d:
        return "outbreak"
    if risk >= threshold or ears_flagged:
        return "warning"
    if risk >= 0.5 * threshold or water_anomaly:
        return "watch"
    return "normal"


def advisory_for(tier: str, h2s_positive: bool, boil_active: bool) -> str:
    if tier == "outbreak" and h2s_positive:
        return "do_not_drink"
    if TIER_ORDER[tier] >= TIER_ORDER["warning"] or boil_active or h2s_positive:
        return "boil"
    return "safe"
