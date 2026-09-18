"""Model features for village i on day d. Only data observed up to day d is used, plus the
3-day rainfall forecast issued on day d (forecasts exist in reality, so this is not leakage)."""
import math

from app.engine import ears
from app.engine.book import NAN, Book
from app.engine.climate import season_label
from app.engine.simulator import CHLORINATION_DAYS
from app.engine.villages import BY_ID, INDEX, SOURCE_LABELS, SOURCES, VILLAGES

FEATURES: list[tuple[str, str]] = [
    ("rain_1d", "rainfall"),
    ("rain_3d", "rainfall"),
    ("rain_7d", "rainfall"),
    ("rain_fc_3d", "forecast"),
    ("turb_last", "turbidity"),
    ("turb_max_3d", "turbidity"),
    ("turb_change", "turbidity"),
    ("dirty_reports_3d", "turbidity"),
    ("ph_last", "chemistry"),
    ("tds_last", "chemistry"),
    ("h2s_pos_7d", "h2s"),
    ("h2s_tests_7d", "h2s"),
    ("h2s_last", "h2s"),
    ("h2s_pos_3d", "h2s"),
    ("days_since_h2s_pos", "h2s"),
    ("h2s_uncleared", "h2s"),
    ("cases_1d", "cases"),
    ("cases_3d", "cases"),
    ("cases_7d", "cases"),
    ("case_trend", "cases"),
    ("cases_per_1k_7d", "cases"),
    ("ears_c2", "ears"),
    ("up_rain_3d", "upstream"),
    ("up_turb_max_3d", "upstream"),
    ("up_h2s_pos_7d", "upstream"),
    ("up_cases_3d", "upstream"),
    ("chlorination_days", "interventions"),
    *((f"src_{s}", "source") for s in SOURCES),
    ("sanitation", "sanitation"),
    ("month_sin", "season"),
    ("month_cos", "season"),
]
NAMES = [f for f, _ in FEATURES]

GROUP_LABELS = {
    "rainfall": "Recent rainfall",
    "forecast": "Rain forecast (3 days)",
    "turbidity": "Water turbidity",
    "chemistry": "pH / dissolved solids",
    "h2s": "H2S (faecal) tests",
    "cases": "Syndromic cases",
    "ears": "Case spike (EARS C2)",
    "upstream": "Upstream village",
    "interventions": "Interventions",
    "source": "Water source",
    "sanitation": "Sanitation coverage",
    "season": "Season",
}
GROUP_PHRASES = {
    "rainfall": "recent rainfall",
    "forecast": "the rain forecast",
    "turbidity": "water turbidity",
    "chemistry": "pH/TDS readings",
    "h2s": "H2S tests",
    "cases": "syndromic cases",
    "ears": "an EARS case spike",
    "upstream": "the upstream village",
    "interventions": "chlorination",
    "source": "the water source",
    "sanitation": "sanitation coverage",
    "season": "the season",
}
GROUPS = list(GROUP_LABELS)
SAFE_NTU = 5.0


def _window(arr: list, d: int, n: int) -> list:
    return arr[max(0, d - n + 1):d + 1]


def _last(arr: list[float], d: int, n: int = 7) -> float:
    for k in range(d, max(-1, d - n), -1):
        if not math.isnan(arr[k]):
            return arr[k]
    return NAN


def _max(vals: list[float]) -> float:
    vals = [v for v in vals if not math.isnan(v)]
    return max(vals) if vals else NAN


def last_h2s_positive(s, d: int, window: int = 14) -> int | None:
    for k in range(d, max(-1, d - window), -1):
        if s.h2s_pos[k]:
            return k
    return None


def h2s_uncleared(s, d: int, window: int = 7) -> bool:
    """An H2S positive within `window` days that no later all-negative retest has cleared."""
    p = last_h2s_positive(s, d, window)
    return p is not None and not any(s.h2s_n[k] for k in range(p + 1, d + 1))


def _h2s_last(s, d: int) -> float:
    for k in range(d, max(-1, d - 7), -1):
        if s.h2s_n[k]:
            return 1.0 if s.h2s_pos[k] else 0.0
    return NAN


def feature_row(book: Book, i: int, d: int) -> list[float]:
    v = VILLAGES[i]
    s = book.series[i]
    turb_last = _last(s.turb, d)
    older = [x for x in s.turb[max(0, d - 10):max(0, d - 3)] if not math.isnan(x)]
    turb_change = turb_last - sorted(older)[len(older) // 2] if older and not math.isnan(turb_last) else NAN
    cases3 = sum(_window(s.cases, d, 3))
    cases7 = sum(_window(s.cases, d, 7))
    prev3 = sum(s.cases[max(0, d - 5):max(0, d - 2)])
    last_pos = last_h2s_positive(s, d)
    row = {
        "rain_1d": s.rain[d],
        "rain_3d": sum(_window(s.rain, d, 3)),
        "rain_7d": sum(_window(s.rain, d, 7)),
        "rain_fc_3d": sum(s.fc[d]),
        "turb_last": turb_last,
        "turb_max_3d": _max(_window(s.turb, d, 3)),
        "turb_change": turb_change,
        "dirty_reports_3d": sum(_window(s.dirty, d, 3)),
        "ph_last": _last(s.ph, d),
        "tds_last": _last(s.tds, d),
        "h2s_pos_7d": sum(_window(s.h2s_pos, d, 7)),
        "h2s_tests_7d": sum(_window(s.h2s_n, d, 7)),
        "h2s_last": _h2s_last(s, d),
        "h2s_pos_3d": sum(_window(s.h2s_pos, d, 3)),
        "days_since_h2s_pos": NAN if last_pos is None else d - last_pos,
        "h2s_uncleared": float(h2s_uncleared(s, d)),
        "cases_1d": s.cases[d],
        "cases_3d": cases3,
        "cases_7d": cases7,
        "case_trend": cases3 - prev3,
        "cases_per_1k_7d": cases7 * 1000 / v.population,
        "ears_c2": ears.c2(s.cases, d),
        "up_rain_3d": NAN,
        "up_turb_max_3d": NAN,
        "up_h2s_pos_7d": NAN,
        "up_cases_3d": NAN,
        "sanitation": v.sanitation,
        "chlorination_days": s.chlor[d],
    }
    if v.upstream_id:
        u = book.series[INDEX[v.upstream_id]]
        row["up_rain_3d"] = sum(_window(u.rain, d, 3))
        row["up_turb_max_3d"] = _max(_window(u.turb, d, 3))
        row["up_h2s_pos_7d"] = sum(_window(u.h2s_pos, d, 7))
        row["up_cases_3d"] = sum(_window(u.cases, d, 3))
    for src in SOURCES:
        row[f"src_{src}"] = 1.0 if v.water_source == src else 0.0
    month = book.date_of(d).month
    row["month_sin"] = math.sin(2 * math.pi * month / 12)
    row["month_cos"] = math.cos(2 * math.pi * month / 12)
    return [float(row[f]) for f in NAMES]


def _fmt(x: float, nd: int = 0) -> str:
    return f"{x:.{nd}f}"


def describe(group: str, row: list[float], i: int, d: int, book: Book) -> str:
    f = {n: row[k] for k, n in enumerate(NAMES)}
    v = VILLAGES[i]
    if group == "rainfall":
        if f["rain_7d"] < 1:
            return "No rain in the last 7 days"
        if f["rain_3d"] < 1:
            return f"{_fmt(f['rain_7d'])} mm in 7 days, dry for 3 days"
        return f"{_fmt(f['rain_3d'])} mm in 3 days ({_fmt(f['rain_1d'])} mm today)"
    if group == "forecast":
        fc = f["rain_fc_3d"]
        return "Dry forecast" if fc < 1 else f"{_fmt(fc)} mm expected in the next 3 days"
    if group == "turbidity":
        t = f["turb_last"]
        dirty = int(f["dirty_reports_3d"])
        extra = f"; {dirty} citizen report{'s' if dirty > 1 else ''} of dirty water" if dirty else ""
        if math.isnan(t):
            return f"No reading in 7 days{extra}"
        rise = f", up {_fmt(f['turb_change'])} NTU" if not math.isnan(f["turb_change"]) and f["turb_change"] >= 3 else ""
        level = f"{t / SAFE_NTU:.0f}x safe limit" if t > 2 * SAFE_NTU else ("above 5 NTU limit" if t > SAFE_NTU else "within 5 NTU limit")
        return f"{_fmt(t, 1)} NTU ({level}{rise}){extra}"
    if group == "chemistry":
        ph, tds = f["ph_last"], f["tds_last"]
        if math.isnan(ph) and math.isnan(tds):
            return "No reading in 7 days"
        parts = []
        if not math.isnan(ph):
            parts.append(f"pH {_fmt(ph, 1)}")
        if not math.isnan(tds):
            parts.append(f"TDS {_fmt(tds)} mg/L")
        return ", ".join(parts)
    if group == "h2s":
        n, pos = int(f["h2s_tests_7d"]), int(f["h2s_pos_7d"])
        if n == 0:
            return "No H2S test in 7 days"
        text = f"{pos} of {n} H2S test{'s' if n > 1 else ''} positive (7 days)"
        if f["h2s_uncleared"]:
            ago = int(f["days_since_h2s_pos"])
            text += ", latest positive " + ("today" if ago == 0 else f"{ago} day{'s' if ago > 1 else ''} ago") + ", not yet cleared"
        return text
    if group == "cases":
        c3, c7, trend = int(f["cases_3d"]), int(f["cases_7d"]), f["case_trend"]
        direction = " (rising)" if trend > 1 else (" (falling)" if trend < -1 else "")
        return f"{c3} case{'s' if c3 != 1 else ''} in 3 days, {c7} in 7 days{direction}"
    if group == "ears":
        return f"C2 = {f['ears_c2']:.1f} (flags at {ears.C2_FLAG:.0f})"
    if group == "upstream":
        if not v.upstream_id:
            return "No upstream village"
        u = BY_ID[v.upstream_id]
        parts = [f"{_fmt(f['up_rain_3d'])} mm rain"]
        if not math.isnan(f["up_turb_max_3d"]):
            parts.append(f"{_fmt(f['up_turb_max_3d'])} NTU")
        if f["up_h2s_pos_7d"]:
            parts.append(f"{int(f['up_h2s_pos_7d'])} H2S positive")
        up3 = int(f["up_cases_3d"])
        parts.append(f"{up3} case{'s' if up3 != 1 else ''} in 3 days")
        return f"{u.name}: " + ", ".join(parts)
    if group == "interventions":
        days = f["chlorination_days"]
        return "No chlorination in effect" if math.isnan(days) else f"Source chlorinated, day {int(days) + 1} of {CHLORINATION_DAYS}"
    if group == "source":
        return SOURCE_LABELS[v.water_source]
    if group == "sanitation":
        return f"{v.sanitation * 100:.0f}% households with safe sanitation"
    dt = book.date_of(d)
    return f"{season_label(dt)} ({dt.strftime('%B')})"
