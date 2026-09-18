"""JSON shapes for /api/v1/ews (see frontend/src/lib/ews.ts)."""
import math
from datetime import timedelta

from app.engine.actions import recommend
from app.engine.templates import ADVISORY, SOURCE_NAMES
from app.engine.tiers import TIER_ORDER
from app.engine.villages import BY_ID, DOWNSTREAM, INDEX, VILLAGES
from app.engine.world import World

TIMESERIES_DAYS = 30


def _num(x: float, nd: int) -> float | None:
    return None if math.isnan(x) else round(float(x), nd)


def _last(arr: list[float], d: int, nd: int) -> float | None:
    for k in range(d, max(-1, d - 7), -1):
        if not math.isnan(arr[k]):
            return round(float(arr[k]), nd)
    return None


def _h2s_last(s, d: int) -> bool | None:
    for k in range(d, max(-1, d - 7), -1):
        if s.h2s_n[k]:
            return s.h2s_pos[k] > 0
    return None


def ranks(world: World) -> dict[int, int]:
    d = world.today
    order = sorted(range(len(VILLAGES)), key=lambda i: (-TIER_ORDER[world.book.series[i].tier[d]], -world.book.series[i].risk[d], i))
    return {i: r + 1 for r, i in enumerate(order)}


def kpis(world: World) -> dict:
    d = world.today
    lo = world.book.date_of(d - 6).isoformat()
    return {
        "villagesAtRisk": sum(1 for s in world.book.series if TIER_ORDER[s.tier[d]] >= TIER_ORDER["warning"]),
        "activeAlerts": sum(1 for a in world.alerts if a["status"] != "resolved"),
        "cases7d": sum(sum(s.cases[max(0, d - 6):d + 1]) for s in world.book.series),
        "positiveWaterTests7d": sum(1 for t in world.tests if t["h2sPositive"] and t["date"] >= lo),
        "populationCovered": sum(v.population for v in VILLAGES),
    }


def sim_state(world: World) -> dict:
    return {
        "currentDate": world.today_date.isoformat(),
        "scenario": world.scenario,
        "scenarioLabel": world.scenario_label,
        "dayOfScenario": world.day_of_scenario,
        "version": world.version,
        "narration": world.narration,
        "kpis": kpis(world),
    }


def village_summary(world: World, i: int, rank: int) -> dict:
    v = VILLAGES[i]
    s = world.book.series[i]
    d = world.today
    return {
        "id": v.id,
        "name": v.name,
        "district": v.district,
        "state": v.state,
        "lat": v.lat,
        "lon": v.lon,
        "population": v.population,
        "language": v.language,
        "waterSource": v.water_source,
        "catchment": v.catchment,
        "upstreamId": v.upstream_id,
        "hasSensor": v.has_sensor,
        "risk": round(s.risk[d], 3),
        "riskDelta": round(s.risk[d] - s.risk[d - 1], 3) if d > 0 else 0.0,
        "tier": s.tier[d],
        "rank": rank,
        "ears": {"c1": round(s.c1[d], 2), "c2": round(s.c2[d], 2), "c3": round(s.c3[d], 2), "flagged": bool(s.flagged[d])},
        "latest": {
            "turbidity": _last(s.turb, d, 1),
            "ph": _last(s.ph, d, 2),
            "tds": _last(s.tds, d, 0),
            "h2sPositive": _h2s_last(s, d),
            "rainfall24h": round(s.rain[d], 1),
            "cases24h": s.cases[d],
            "cases7d": sum(s.cases[max(0, d - 6):d + 1]),
        },
        "advisory": s.advisory[d],
    }


def village_summaries(world: World) -> list[dict]:
    r = ranks(world)
    return sorted((village_summary(world, i, r[i]) for i in range(len(VILLAGES))), key=lambda x: x["rank"])


def _neighbour(world: World, vid: str) -> dict:
    s = world.book.series[INDEX[vid]]
    return {"id": vid, "name": BY_ID[vid].name, "tier": s.tier[world.today], "risk": round(s.risk[world.today], 3)}


def _newest(items: list[dict], vid: str, limit: int) -> list[dict]:
    rows = [x for x in items if x["villageId"] == vid]
    return sorted(rows, key=lambda x: (x["date"], x["id"]), reverse=True)[:limit]


def public(iv: dict) -> dict:
    return {k: val for k, val in iv.items() if not k.startswith("_")}


def village_detail(world: World, i: int, threshold: float) -> dict:
    v = VILLAGES[i]
    s = world.book.series[i]
    d = world.today
    ex = world.explanations[i]
    timeseries = []
    for k in range(max(0, d - TIMESERIES_DAYS + 1), d + 1):
        timeseries.append({
            "date": world.book.date_of(k).isoformat(),
            "rainfall": round(s.rain[k], 1),
            "turbidity": _num(s.turb[k], 1),
            "ph": _num(s.ph[k], 2),
            "h2sPositive": (s.h2s_pos[k] > 0) if s.h2s_n[k] else None,
            "cases": s.cases[k],
            "risk": round(s.risk[k], 3),
            "earsC2": round(s.c2[k], 2),
            "tier": s.tier[k],
        })
    today = world.today_date
    return {
        **village_summary(world, i, ranks(world)[i]),
        "timeseries": timeseries,
        "forecast": [{"date": (today + timedelta(days=k + 1)).isoformat(), "rainfallMm": round(mm, 1)} for k, mm in enumerate(s.fc[d])],
        "explanation": {
            "risk": round(ex["risk"], 3),
            "baseRisk": round(ex["base"], 3),
            "summary": world.summary(i),
            "factors": world.factors(i),
            "detectors": {
                "ml": {"risk": round(ex["risk"], 3), "threshold": threshold, "triggered": ex["risk"] >= threshold},
                "ears": {"c2": round(s.c2[d], 2), "c3": round(s.c3[d], 2), "triggered": bool(s.flagged[d])},
            },
        },
        "actions": recommend(world, i),
        "interventions": [public(iv) for iv in sorted((x for x in world.interventions if x["villageId"] == v.id), key=lambda x: -x["id"])],
        "waterTests": _newest(world.tests, v.id, 20),
        "reports": _newest(world.reports, v.id, 20),
        "upstream": _neighbour(world, v.upstream_id) if v.upstream_id else None,
        "downstream": [_neighbour(world, w) for w in DOWNSTREAM[v.id]],
    }


def advisory(world: World, i: int, lang: str) -> dict:
    v = VILLAGES[i]
    s = world.book.series[i]
    d = world.today
    status = s.advisory[d]
    since = d
    while since > 0 and s.advisory[since - 1] == status:
        since -= 1
    tpl = ADVISORY[status]
    fmt = {"village": v.name, "asha": v.asha, "phc": v.phc, "source": SOURCE_NAMES[v.water_source][lang]}
    return {
        "villageId": v.id,
        "villageName": v.name,
        "status": status,
        "tier": s.tier[d],
        "headline": tpl["headline"][lang].format(**fmt),
        "instructions": [line.format(**fmt) for line in tpl["instructions"][lang]],
        "updatedDate": world.book.date_of(since).isoformat(),
        "language": lang,
    }
