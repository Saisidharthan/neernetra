from datetime import date

import numpy as np

from app.engine.book import Book, ingest
from app.engine.climate import Climate
from app.engine.simulator import CHLORINATION_DAYS, CHLORINATION_FACTOR, Effects, Simulator
from app.engine.villages import VILLAGES

HISTORY_SEED = 20220101
HISTORY_START = date(2022, 1, 1)
HISTORY_DAYS = 1461
EPISODE_MERGE_GAP = 5
HORIZON = 7
ROUTINE_CHLORINATION_P = 1 / 75


def generate_history(seed: int = HISTORY_SEED, start: date = HISTORY_START, days: int = HISTORY_DAYS) -> Book:
    climate = Climate(seed, start)
    sim = Simulator(seed, climate)
    book = Book(start)
    campaign_start: dict[int, int] = {}
    # Routine PHED chlorination campaigns start at random, independent of outbreaks, so the model
    # can learn what chlorination does to risk without confounding by reactive responses.
    for d in range(days):
        for i in range(len(VILLAGES)):
            if (i not in campaign_start or d - campaign_start[i] >= CHLORINATION_DAYS) \
                    and np.random.default_rng([seed, d, i + 1, 60]).random() < ROUTINE_CHLORINATION_P:
                campaign_start[i] = d
        chlor = {i: d - s for i, s in campaign_start.items() if d - s < CHLORINATION_DAYS}
        obs = sim.advance({i: Effects(chlorination=CHLORINATION_FACTOR) for i in chlor})
        book.open_day([o.rain for o in obs], climate.forecast(d), [o.onsets for o in obs], chlor)
        for i, o in enumerate(obs):
            ingest(book, i, d, o)
    return book


def outbreak_flags(book: Book, i: int) -> list[bool]:
    onsets = book.series[i].onsets
    k = VILLAGES[i].true_outbreak_onsets_3d
    return [sum(onsets[max(0, d - 2):d + 1]) >= k for d in range(len(onsets))]


def episodes(flags: list[bool], merge_gap: int = EPISODE_MERGE_GAP) -> list[tuple[int, int]]:
    out: list[list[int]] = []
    for d, f in enumerate(flags):
        if not f:
            continue
        if out and d - out[-1][1] <= merge_gap:
            out[-1][1] = d
        else:
            out.append([d, d])
    return [(a, b) for a, b in out]


def labels(flags: list[bool], horizon: int = HORIZON) -> list[int]:
    n = len(flags)
    return [int(any(flags[d + 1:min(n, d + horizon + 1)])) for d in range(n)]
