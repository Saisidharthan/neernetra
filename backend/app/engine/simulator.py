"""Stateful day-by-day causal cascade:
rain -> turbidity -> latent faecal contamination (runoff x poor sanitation, upstream coupling,
non-rain events) -> H2S positivity -> infections (1-5 day incubation) -> under-reported, delayed
syndromic case reports.

Every random draw comes from a generator keyed by (seed, day, village, stream), so the same
actions always give the same results, and an intervention only changes what it causally touches."""
import math
from dataclasses import dataclass, field

import numpy as np

from app.engine.climate import Climate, is_monsoon
from app.engine.villages import INDEX, VILLAGES

INCUBATION = np.array([0.18, 0.3, 0.26, 0.16, 0.10])
REPORT_DELAY = np.array([0.3, 0.35, 0.22, 0.13])
WATER_MIX = np.array([0.56, 0.18, 0.12, 0.04, 0.10])
BACKGROUND_MIX = np.array([0.34, 0.14, 0.42, 0.05, 0.05])
SEASON = [0.6, 0.65, 0.75, 0.9, 1.0, 1.1, 1.1, 1.1, 1.05, 0.95, 0.8, 0.65]
BASE_PH = {"river": 7.1, "pond": 6.9, "spring": 6.6, "tubewell": 6.8, "piped": 7.3}
BASE_TDS = {"river": 140.0, "pond": 220.0, "spring": 60.0, "tubewell": 320.0, "piped": 180.0}
CLEAR_SOURCES = {"piped", "tubewell", "spring"}

BETA = 0.002
SECONDARY = 0.1
BACKGROUND_RATE = 0.00009
RAIN_THRESHOLD_MM = 20.0
FLOOD_RUNOFF_MM = 70.0
PIPE_BURST_P = 1 / 320
SEWAGE_P = 1 / 300
RETEST_DAYS = 3
SENSOR_MAX_NTU = 100.0
CHLORINATION_DAYS = 12
CHLORINATION_FACTOR = 0.08

STREAM_PROCESS, STREAM_INFECTION, STREAM_OBSERVE, STREAM_REPORT, STREAM_EVENTS = range(5)


@dataclass
class Effects:
    chlorination: float = 1.0
    boil: float = 0.0
    report_boost: float = 0.0
    secondary_cut: float = 0.0
    exposure_cut: float = 0.0
    extra_tests: int = 0


@dataclass
class Event:
    kind: str
    village: int
    start: int
    days: int
    intensity: float
    turbidity: float

    def active(self, d: int) -> bool:
        return self.start <= d < self.start + self.days


@dataclass
class VillageState:
    c_src: float = 0.05
    t_excess: float = 0.0
    incubation: np.ndarray = field(default_factory=lambda: np.zeros(5, dtype=int))
    water_queue: np.ndarray = field(default_factory=lambda: np.zeros(4, dtype=int))
    bg_queue: np.ndarray = field(default_factory=lambda: np.zeros(4, dtype=int))
    held: list = field(default_factory=list)
    flood: float = 0.0
    recent_onsets: list = field(default_factory=lambda: [0, 0, 0])
    outage: int = 0
    retest: int = 0


@dataclass
class DayObs:
    rain: float
    sensor: tuple[float, float, float] | None
    kit: tuple[float, float] | None
    h2s: list[bool]
    citizen: list[str]
    reports: list[tuple[str, str, list[int]]]
    onsets: int
    events: list[str]


def _rng(seed: int, d: int, i: int, stream: int) -> np.random.Generator:
    return np.random.default_rng([seed, d, i + 1, stream])


def h2s_probability(c: float) -> float:
    return 0.03 + 0.94 / (1 + math.exp(-2.4 * (math.log(c + 1e-3) - math.log(0.3))))


class Simulator:
    def __init__(self, seed: int, climate: Climate, random_events: bool = True):
        self.seed = seed
        self.climate = climate
        self.random_events = random_events
        self.day = -1
        self.states = [VillageState() for _ in VILLAGES]
        self.events: list[Event] = []

    def add_event(self, kind: str, village: int, start: int, days: int, intensity: float, turbidity: float):
        self.events.append(Event(kind, village, start, days, intensity, turbidity))

    def _random_events(self, d: int, rain: np.ndarray):
        for i, v in enumerate(VILLAGES):
            rng = _rng(self.seed, d, i, STREAM_EVENTS)
            u_burst, u_sewage = rng.random(2)
            days, intensity, turbidity = rng.integers(3, 7), rng.uniform(1.2, 2.8), rng.uniform(10, 25)
            if not self.random_events or any(e.village == i and e.active(d) for e in self.events):
                continue
            if v.water_source == "piped" and u_burst < PIPE_BURST_P:
                self.add_event("pipe_burst", i, d, int(days), intensity, turbidity)
            elif u_sewage < SEWAGE_P * (3.0 if rain[i] > 40 else 1.0):
                self.add_event("sewage_overflow", i, d, int(days) - 1, intensity * 0.65, turbidity * 0.25)

    def advance(self, effects: dict[int, Effects] | None = None) -> list[DayObs]:
        effects = effects or {}
        d = self.day + 1
        dt = self.climate.date_of(d)
        season = SEASON[dt.month - 1]
        rain = self.climate.rain(d)
        prev1 = self.climate.rain(d - 1) if d >= 1 else rain
        prev2 = self.climate.rain(d - 2) if d >= 2 else prev1
        self._random_events(d, rain)
        prev_c = [s.c_src for s in self.states]
        prev_t = [s.t_excess for s in self.states]
        out: list[DayObs] = []
        for i, v in enumerate(VILLAGES):
            st = self.states[i]
            eff = effects.get(i, Effects())
            prof = v.source
            runoff = 0.55 * rain[i] + 0.3 * prev1[i] + 0.15 * prev2[i]
            p = _rng(self.seed, d, i, STREAM_PROCESS)
            n_in, n_bg, n_turb, n_tbase, n_ph, n_tds = p.lognormal(0, 0.3), p.lognormal(0, 0.4), p.lognormal(0, 0.2), p.lognormal(0, 0.12), p.normal(0, 0.08), p.normal(0, 8)

            active = [e for e in self.events if e.village == i and e.active(d)]
            rain_in = prof.rain_k * (1 - v.sanitation) * max(0.0, runoff - RAIN_THRESHOLD_MM) ** 1.5 / 250 * season
            up = INDEX[v.upstream_id] if v.upstream_id else None
            up_in = prof.upstream_k * prev_c[up] if up is not None else 0.0
            event_in = sum(e.intensity for e in active)
            st.flood = max(0.75 * st.flood, (runoff - FLOOD_RUNOFF_MM) / 50)
            flood_in = 0.5 * st.flood * (1 - v.sanitation) * prof.rain_k
            st.c_src = prof.decay * st.c_src + (rain_in + up_in + event_in + flood_in) * n_in + prof.background * season * n_bg
            turb_up = 0.35 * prev_t[up] if up is not None else 0.0
            st.t_excess = prof.turbidity_memory * st.t_excess + prof.turbidity_k * runoff * n_turb + turb_up + sum(e.turbidity for e in active)
            turbidity = prof.turbidity_base * n_tbase + st.t_excess
            chlor = eff.chlorination if turbidity < 20 else min(1.0, eff.chlorination * 2.5)
            c_drink = st.c_src * chlor
            ph = BASE_PH[v.water_source] - 0.006 * min(runoff, 120) + n_ph
            tds = max(20.0, BASE_TDS[v.water_source] * (1 - 0.35 * min(runoff, 100) / 100) + 45 * min(st.c_src, 3) + n_tds)

            inf = _rng(self.seed, d, i, STREAM_INFECTION)
            exposed = v.population * prof.exposure * (1 - eff.boil) * (1 - eff.exposure_cut)
            lam = exposed * BETA * season * c_drink + SECONDARY * (1 - eff.secondary_cut) * sum(st.recent_onsets)
            new_inf = inf.poisson(lam)
            water_onsets = int(st.incubation[0])
            st.incubation = np.append(st.incubation[1:], 0) + inf.multinomial(new_inf, INCUBATION)
            bg_onsets = int(inf.poisson(v.population * BACKGROUND_RATE * (0.7 + 0.5 * season)))
            onsets = water_onsets + bg_onsets
            st.recent_onsets = st.recent_onsets[1:] + [water_onsets]

            rep = _rng(self.seed, d, i, STREAM_REPORT)
            p_rep = min(0.92, v.report_rate + eff.report_boost)
            st.water_queue += rep.multinomial(rep.binomial(water_onsets, p_rep), REPORT_DELAY)
            st.bg_queue += rep.multinomial(rep.binomial(bg_onsets, p_rep), REPORT_DELAY)
            reported_w, reported_b = int(st.water_queue[0]), int(st.bg_queue[0])
            st.water_queue = np.append(st.water_queue[1:], 0)
            st.bg_queue = np.append(st.bg_queue[1:], 0)
            symptoms = rep.multinomial(reported_w, WATER_MIX) + rep.multinomial(reported_b, BACKGROUND_MIX)
            clinic = rep.binomial(symptoms, 0.38)
            asha = symptoms - clinic
            held_today = rep.random() < 0.05
            reports: list[tuple[str, str, list[int]]] = []
            if st.held:
                reports.append(("asha", "offline_sync", st.held))
                st.held = []
            if asha.sum() > 0:
                if held_today:
                    st.held = asha.tolist()
                else:
                    reports.append(("asha", "app", asha.tolist()))
            if clinic.sum() > 0:
                reports.append(("clinic", "app", clinic.tolist()))

            obs = _rng(self.seed, d, i, STREAM_OBSERVE)
            u_out, out_len, u_visit, u_extra = obs.random(), obs.integers(1, 5), obs.random(), obs.random()
            s_turb, s_ph, s_tds = obs.lognormal(0, 0.1), obs.normal(0, 0.05), obs.normal(0, 8)
            k_turb, k_ph = obs.lognormal(0, 0.2), obs.normal(0, 0.15)
            u_h2s = obs.random(8)
            u_cit, u_spur, u_retest = obs.random(), obs.random(), obs.random()
            sensor = None
            if v.has_sensor:
                if st.outage > 0:
                    st.outage -= 1
                elif u_out < 0.025:
                    st.outage = int(out_len) - 1
                else:
                    sensor = (round(min(SENSOR_MAX_NTU, turbidity * s_turb), 1), round(ph + s_ph, 2), round(tds + s_tds))
            visit = dt.weekday() == v.test_weekday and u_visit < 0.82
            extra = is_monsoon(dt) and dt.weekday() == (v.test_weekday + 3) % 7 and u_extra < 0.5
            retest = st.retest > 0 and u_retest < 0.85
            st.retest = max(0, st.retest - 1)
            kit = None
            if (visit or retest) and not v.has_sensor:
                kit = (float(max(5, 5 * round(turbidity * k_turb / 5))), round(round((ph + k_ph) * 2) / 2, 1))
            n_tests = min(len(u_h2s), int(visit) + int(extra) + int(retest) + eff.extra_tests)
            p_pos = h2s_probability(c_drink)
            h2s = [bool(u_h2s[k] < p_pos) for k in range(n_tests)]
            citizen = []
            if v.water_source in CLEAR_SOURCES and turbidity > 12 and u_cit < 0.45:
                citizen.append("muddy" if turbidity > 30 else "cloudy")
            elif v.water_source not in CLEAR_SOURCES and turbidity > 25 and u_cit < 0.04:
                citizen.append("muddy")
            elif u_spur < 0.004:
                citizen.append("cloudy")
            if any(h2s) or citizen:
                st.retest = RETEST_DAYS

            out.append(DayObs(
                rain=float(rain[i]), sensor=sensor, kit=kit, h2s=h2s, citizen=citizen, reports=reports,
                onsets=onsets, events=[e.kind for e in active],
            ))
        self.day = d
        return out
