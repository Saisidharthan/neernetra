from app.engine.features import NAMES, h2s_uncleared
from app.engine.tiers import TIER_ORDER
from app.engine.villages import BY_ID, INDEX, VILLAGES

PRIORITY = {"high": 0, "medium": 1, "low": 2}


def recommend(world, i: int) -> list[dict]:
    v = VILLAGES[i]
    ex = world.explanations[i]
    d = ex["d"]
    s = world.book.series[i]
    f = dict(zip(NAMES, ex["row"]))
    g = ex["grouped"]
    tier = TIER_ORDER[s.tier[d]]
    h2s_open = h2s_uncleared(s, d)
    out: dict[str, dict] = {}

    def add(kind: str, title: str, reason: str, priority: str):
        if kind not in out:
            out[kind] = {"type": kind, "title": title, "reason": reason, "priority": priority,
                         "alreadyActive": world.intervention_active(v.id, kind)}

    pos7 = int(f["h2s_pos_7d"])
    if pos7:
        add("chlorination", "Shock-chlorinate the drinking-water source",
            f"{pos7} H2S-positive test{'s' if pos7 > 1 else ''} in the last 7 days", "high")
    elif tier >= TIER_ORDER["warning"] and max(g["turbidity"], g["upstream"], g["rainfall"], g["forecast"]) > 0.2:
        add("chlorination", "Chlorinate the source pre-emptively",
            "Runoff and turbidity make faecal contamination likely", "medium")
    if tier >= TIER_ORDER["warning"] or h2s_open:
        reason = f"Village is at {s.tier[d].upper()}" if tier >= TIER_ORDER["warning"] else "H2S positive, not yet cleared by a negative retest"
        add("boil_advisory", "Issue a boil-water advisory", reason, "high")
    rising = f["case_trend"] > 1 and f["cases_3d"] >= 3
    if rising or s.flagged[d]:
        cases = f"{int(f['cases_3d'])} cases in 3 days" + (" and rising" if rising else "")
        if s.flagged[d]:
            cases += f"; EARS C2 {s.c2[d]:.1f}"
        add("medical_camp", "Hold a medical camp with active case search", cases, "high" if s.tier[d] == "outbreak" else "medium")
        add("ors_distribution", "Pre-position ORS and zinc with the ASHA", cases, "medium")
    if v.upstream_id:
        u = BY_ID[v.upstream_id]
        u_tier = world.book.series[INDEX[u.id]].tier[d]
        if TIER_ORDER[u_tier] >= TIER_ORDER["watch"] or g["upstream"] > 0.25:
            add("source_testing", "Test the intake and the upstream stretch",
                f"Upstream {u.name} is at {u_tier.upper()}" if u_tier != "normal" else f"Upstream signal from {u.name}", "medium")
    if f["h2s_tests_7d"] == 0 and tier >= TIER_ORDER["watch"]:
        add("source_testing", "Run H2S and field-kit tests today", "No water test in the last 7 days", "medium")
    if tier >= TIER_ORDER["watch"] and v.sanitation < 0.45:
        add("awareness_drive", "Hygiene and safe-water awareness drive",
            f"Only {v.sanitation * 100:.0f}% of households have safe sanitation", "low")
    return sorted(out.values(), key=lambda a: PRIORITY[a["priority"]])
