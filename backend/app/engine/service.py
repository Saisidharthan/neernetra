import json
import threading

from app.engine import store
from app.engine.backtest import summary
from app.engine.build import build
from app.engine.model import RiskModel
from app.engine.scenarios import DEFAULT_SCENARIO, SCENARIOS
from app.engine.world import World


class EwsService:
    """Process-wide owner of the model and the live world. Every access goes through `lock`."""

    def __init__(self):
        self.lock = threading.RLock()
        self.model: RiskModel | None = None
        self.card: dict | None = None
        self.world: World | None = None

    def start(self, log=print):
        with self.lock:
            if store.ready(SCENARIOS):
                log(summary(json.loads(store.CARD_PATH.read_text())))
            else:
                log("[engine] artifacts or snapshots missing: simulating history, training and backtesting")
                build(log)
            self.model = RiskModel.load(store.MODEL_PATH, store.META_PATH)
            self.card = json.loads(store.CARD_PATH.read_text())
            self.world = store.read_pickle(store.STATE_PATH) if store.STATE_PATH.exists() else self._snapshot(DEFAULT_SCENARIO)
            self.save()
            log(f"[engine] live scenario '{self.world.scenario}', day {self.world.day_of_scenario}, {self.world.today_date}")

    def _snapshot(self, scenario: str) -> World:
        return store.read_pickle(store.snapshot_path(scenario))

    def save(self):
        store.write_pickle(store.STATE_PATH, self.world)

    def reset(self, scenario: str) -> World:
        world = self._snapshot(scenario)
        world.version = self.world.version + 1
        self.world = world
        self.save()
        return world


service = EwsService()
