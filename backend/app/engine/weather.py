import time

import httpx

from app.engine.villages import Village

URL = "https://api.open-meteo.com/v1/forecast"
TIMEOUT_S = 5.0
CACHE_TTL_S = 900
_cache: dict[str, tuple[float, dict]] = {}


def forecast(v: Village) -> dict:
    hit = _cache.get(v.id)
    if hit and time.time() - hit[0] < CACHE_TTL_S:
        return hit[1]
    params = {
        "latitude": v.lat,
        "longitude": v.lon,
        "daily": "precipitation_sum,precipitation_probability_max",
        "forecast_days": 7,
        "timezone": "Asia/Kolkata",
    }
    try:
        res = httpx.get(URL, params=params, timeout=TIMEOUT_S)
        res.raise_for_status()
        daily = res.json()["daily"]
        probs = daily.get("precipitation_probability_max") or [None] * len(daily["time"])
        days = [
            {"date": d, "precipitationMm": float(mm or 0.0), "precipitationProbability": None if p is None else float(p)}
            for d, mm, p in zip(daily["time"], daily["precipitation_sum"], probs)
        ]
    except Exception:
        return {"villageId": v.id, "source": "unavailable", "days": []}
    out = {"villageId": v.id, "source": "open-meteo", "days": days}
    _cache[v.id] = (time.time(), out)
    return out
