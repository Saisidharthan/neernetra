from dataclasses import dataclass, field
from datetime import date, timedelta

from app.engine.climate import Climate
from app.engine.model import RiskModel
from app.engine.simulator import Simulator
from app.engine.villages import INDEX
from app.engine.world import World

WARMUP_DAYS = 50


@dataclass(frozen=True)
class Scenario:
    id: str
    label: str
    description: str
    seed: int
    day0: date
    intro: str
    scale: list[tuple[int, int, float]]
    rain: dict[int, dict[str, float]] = field(default_factory=dict)
    events: list[tuple[int, str, str, int, float, float]] = field(default_factory=list)


SCENARIOS: dict[str, Scenario] = {
    s.id: s for s in [
        Scenario(
            id="monsoon_flood",
            label="Monsoon flood: Kulsi cloudburst",
            description="Mid-July break in the monsoon ends with a cloudburst over Ukiam at the head of the Kulsi river on day 2. "
                        "Runoff and contamination cascade downstream; without action 2-3 villages reach outbreak around days 5-8.",
            seed=2607,
            day0=date(2026, 7, 14),
            intro="Day 0 · 14 Jul: Monsoon break over Kamrup. IMD forecasts very heavy rain over the upper Kulsi catchment in 48 hours.",
            scale=[(0, WARMUP_DAYS - 25, 0.6), (WARMUP_DAYS - 25, WARMUP_DAYS - 7, 0.3), (WARMUP_DAYS - 7, WARMUP_DAYS + 5, 0.1),
                   (WARMUP_DAYS + 5, 10_000, 0.5)],
            rain={
                1: {"KMR01": 38, "KMR02": 32, "KMR03": 24, "KMR04": 20, "KMR05": 16},
                2: {"KMR01": 196, "KMR02": 148, "KMR03": 72, "KMR04": 58, "KMR05": 44, "KMR10": 36},
                3: {"KMR01": 62, "KMR02": 54, "KMR03": 41, "KMR04": 33, "KMR05": 28},
                4: {"KMR01": 21, "KMR02": 18, "KMR03": 14, "KMR04": 12, "KMR05": 9},
            },
        ),
        Scenario(
            id="pipe_burst",
            label="Pipeline burst: Rangia (dry season)",
            description="Dry February weather. On day 2 a leaking main lets sewage into Rangia's piped supply. "
                        "No rain is involved, which shows the model is not just a rainfall alarm.",
            seed=2602,
            day0=date(2026, 2, 10),
            intro="Day 0 · 10 Feb: Dry season across Kamrup and Ri-Bhoi. No rain forecast this week.",
            scale=[(0, 10_000, 1.0)],
            events=[(2, "KMR09", "pipe_burst", 6, 2.4, 18.0)],
        ),
        Scenario(
            id="calm",
            label="Calm dry season",
            description="Mid-January baseline with no contamination event. Shows how often NeerNetra raises an alarm when nothing is wrong.",
            seed=2601,
            day0=date(2026, 1, 12),
            intro="Day 0 · 12 Jan: Dry season baseline. Routine surveillance only.",
            scale=[(0, 10_000, 1.0)],
        ),
    ]
}
DEFAULT_SCENARIO = "monsoon_flood"


def build_world(scn: Scenario, model: RiskModel) -> World:
    start = scn.day0 - timedelta(days=WARMUP_DAYS)
    climate = Climate(scn.seed, start, scn.scale)
    for day, rows in scn.rain.items():
        for vid, mm in rows.items():
            climate.set_rain(WARMUP_DAYS + day, INDEX[vid], mm)
    sim = Simulator(scn.seed, climate, random_events=False)
    for day, vid, kind, days, intensity, turbidity in scn.events:
        sim.add_event(kind, INDEX[vid], WARMUP_DAYS + day, days, intensity, turbidity)
    world = World(scn.id, scn.label, climate, sim)
    for _ in range(WARMUP_DAYS + 1):
        world.advance_day(model)
    world.day0 = WARMUP_DAYS
    world.narration = scn.intro
    world.beats = []
    return world
