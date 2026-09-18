"""Per-village daily observation arrays. The same structure backs the 4-year training history
and the live world, so features are computed by one code path for training and serving."""
import math
from datetime import date, timedelta

from app.engine.villages import VILLAGES

NAN = float("nan")


class Series:
    def __init__(self):
        self.rain: list[float] = []
        self.fc: list[tuple[float, float, float]] = []
        self.turb: list[float] = []
        self.ph: list[float] = []
        self.tds: list[float] = []
        self.h2s_n: list[int] = []
        self.h2s_pos: list[int] = []
        self.dirty: list[int] = []
        self.cases: list[int] = []
        self.onsets: list[int] = []
        self.chlor: list[float] = []
        self.risk: list[float] = []
        self.c1: list[float] = []
        self.c2: list[float] = []
        self.c3: list[float] = []
        self.flagged: list[bool] = []
        self.tier: list[str] = []
        self.advisory: list[str] = []


class Book:
    def __init__(self, start: date):
        self.start = start
        self.series = [Series() for _ in VILLAGES]

    @property
    def days(self) -> int:
        return len(self.series[0].rain)

    @property
    def today(self) -> int:
        return self.days - 1

    def date_of(self, d: int) -> date:
        return self.start + timedelta(days=d)

    def index_of(self, dt: date) -> int:
        return (dt - self.start).days

    def open_day(self, rain: list[float], forecast, onsets: list[int], chlor: dict[int, int]):
        for i, s in enumerate(self.series):
            s.chlor.append(float(chlor[i]) if i in chlor else NAN)
            s.rain.append(float(rain[i]))
            s.fc.append(tuple(float(x) for x in forecast[i]))
            for arr in (s.turb, s.ph, s.tds):
                arr.append(NAN)
            for arr in (s.risk, s.c1, s.c2, s.c3):
                arr.append(0.0)
            for arr in (s.h2s_n, s.h2s_pos, s.dirty, s.cases):
                arr.append(0)
            s.onsets.append(int(onsets[i]))
            s.flagged.append(False)
            s.tier.append("normal")
            s.advisory.append("safe")

    def add_cases(self, i: int, d: int, n: int):
        self.series[i].cases[d] += n

    def add_water(self, i: int, d: int, turbidity=None, ph=None, tds=None, h2s=None, appearance=None):
        s = self.series[i]
        if turbidity is not None:
            s.turb[d] = turbidity if math.isnan(s.turb[d]) else max(s.turb[d], turbidity)
        if ph is not None:
            s.ph[d] = ph
        if tds is not None:
            s.tds[d] = tds
        if h2s is not None:
            s.h2s_n[d] += 1
            s.h2s_pos[d] += int(h2s)
        if appearance in ("cloudy", "muddy"):
            s.dirty[d] += 1


def ingest(book: Book, i: int, d: int, obs, on_test=None, on_report=None):
    """Apply one simulated day's observations for village i; callbacks create API records in the live world."""
    tests = []
    if obs.sensor:
        turb, ph, tds = obs.sensor
        tests.append({"source": "sensor", "turbidity": turb, "ph": ph, "tds": tds, "h2s": None, "appearance": None})
    h2s = list(obs.h2s)
    if obs.kit:
        turb, ph = obs.kit
        tests.append({"source": "h2s_kit", "turbidity": turb, "ph": ph, "tds": None, "h2s": h2s.pop(0) if h2s else None, "appearance": None})
    for result in h2s:
        tests.append({"source": "h2s_kit", "turbidity": None, "ph": None, "tds": None, "h2s": result, "appearance": None})
    for appearance in obs.citizen:
        tests.append({"source": "citizen", "turbidity": None, "ph": None, "tds": None, "h2s": None, "appearance": appearance})
    for t in tests:
        book.add_water(i, d, turbidity=t["turbidity"], ph=t["ph"], tds=t["tds"], h2s=t["h2s"], appearance=t["appearance"])
        if on_test:
            on_test(i, d, t)
    for role, channel, symptoms in obs.reports:
        book.add_cases(i, d, sum(symptoms))
        if on_report:
            on_report(i, d, role, channel, symptoms)
