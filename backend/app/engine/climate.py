import math
from datetime import date, timedelta

import numpy as np

from app.engine.villages import VILLAGES

MONTH_MEAN_MM = [0.4, 0.8, 2.2, 5.0, 8.8, 11.5, 12.2, 9.8, 7.2, 3.3, 0.6, 0.3]
WET_PROB = [0.06, 0.09, 0.18, 0.38, 0.55, 0.7, 0.74, 0.66, 0.56, 0.27, 0.07, 0.04]
SITE_FACTOR = np.array([1.25 if v.state == "Meghalaya" or v.id == "KMR01" else 1.0 for v in VILLAGES])
CATCHMENTS: dict[str, list[int]] = {}
for _i, _v in enumerate(VILLAGES):
    CATCHMENTS.setdefault(_v.catchment or _v.id, []).append(_i)
CLOUDBURST_P = 0.005
FORECAST_SIGMA = (0.35, 0.5, 0.65)
EXTREME_SKILL = ((0.5, 1.0), (0.3, 0.8), (0.1, 0.45))


def is_monsoon(d: date) -> bool:
    return 6 <= d.month <= 9


def season_label(d: date) -> str:
    if is_monsoon(d):
        return "Monsoon"
    if d.month in (4, 5):
        return "Pre-monsoon"
    if d.month in (10, 11):
        return "Post-monsoon"
    return "Dry season"


class Climate:
    """Daily rainfall for every village: a persistent regional wet/dry process with seasonal
    probabilities, gamma-distributed amounts, local variation and rare monsoon cloudbursts."""

    def __init__(self, seed: int, start: date, scale: list[tuple[int, int, float]] | None = None):
        self.seed = seed
        self.start = start
        self.scale = scale or []
        self.rows: list[np.ndarray] = []
        self.cloudburst: list[np.ndarray] = []
        self.overrides: dict[int, dict[int, float]] = {}
        self.z = 0.0

    def date_of(self, d: int) -> date:
        return self.start + timedelta(days=d)

    def _factor(self, d: int) -> float:
        for lo, hi, f in self.scale:
            if lo <= d < hi:
                return f
        return 1.0

    def _generate(self, d: int):
        rng = np.random.default_rng([self.seed, d, 0, 90])
        month = self.date_of(d).month - 1
        self.z = 0.65 * self.z + math.sqrt(1 - 0.65**2) * rng.standard_normal()
        u = 0.5 * (1 + math.erf(self.z / math.sqrt(2)))
        p = WET_PROB[month]
        mean_wet = MONTH_MEAN_MM[month] / p
        n = len(VILLAGES)
        local_noise = rng.lognormal(0.0, 0.45, n)
        local_wet = rng.random(n)
        shower = rng.gamma(0.8, 4.0, n)
        regional = rng.gamma(0.75, mean_wet / 0.75) * math.exp(0.35 * self.z)
        f = self._factor(d)
        if u < p:
            rain = np.where(local_wet < 0.87, regional * local_noise * SITE_FACTOR, 0.0)
        else:
            rain = np.where(local_wet < 0.06 * p, shower, 0.0)
        rain = rain * f
        burst = np.zeros(n, dtype=bool)
        if 5 <= month <= 8 and f > 0.5:
            for members in CATCHMENTS.values():
                if rng.random() < CLOUDBURST_P * len(members) ** 0.5:
                    centre = members[0] if rng.random() < 0.6 else members[int(rng.integers(len(members)))]
                    amount = rng.uniform(110, 220)
                    for i in members:
                        share = 1.0 if i == centre else rng.uniform(0.3, 0.6)
                        rain[i] = max(rain[i], amount * share)
                    burst[centre] = True
        self.rows.append(np.round(rain, 1))
        self.cloudburst.append(burst)

    def ensure(self, d: int):
        while len(self.rows) <= d:
            self._generate(len(self.rows))

    def rain(self, d: int) -> np.ndarray:
        self.ensure(d)
        row = self.rows[d].copy()
        for i, mm in self.overrides.get(d, {}).items():
            row[i] = mm
        return row

    def is_burst(self, d: int, i: int) -> bool:
        self.ensure(d)
        return bool(self.cloudburst[d][i]) or self.overrides.get(d, {}).get(i, 0.0) >= 100

    def set_rain(self, d: int, i: int, mm: float):
        self.overrides.setdefault(d, {})[i] = round(mm, 1)

    def forecast(self, d: int) -> np.ndarray:
        """3-day rainfall forecast issued on day d (rows: villages, cols: lead 1..3)."""
        rng = np.random.default_rng([self.seed, d, 0, 91])
        n = len(VILLAGES)
        out = np.zeros((n, 3))
        for k in range(3):
            truth = self.rain(d + k + 1)
            noise = rng.lognormal(0.0, FORECAST_SIGMA[k], n)
            miss = rng.random(n)
            false_rain = rng.gamma(1.2, 8.0, n)
            under = rng.uniform(*EXTREME_SKILL[k], n)
            fc = truth * noise
            fc = np.where(truth >= 100, truth * under, fc)
            fc = np.where((truth > 1) & (miss < 0.08 * (k + 1)), truth * 0.15, fc)
            fc = np.where((truth <= 1) & (miss > 1 - 0.05 * (k + 1)), false_rain, fc)
            out[:, k] = np.round(fc, 1)
        return out
