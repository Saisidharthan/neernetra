"""Rebuild everything: simulate 4 years, train + backtest the model, write artifacts and scenario snapshots.

    python -m app.engine.build
"""
import json
import time
from datetime import datetime, timezone

from app.engine import store
from app.engine.backtest import summary, train_and_backtest
from app.engine.features import NAMES
from app.engine.model import RiskModel
from app.engine.scenarios import SCENARIOS, build_world


def build(log=print) -> dict:
    t0 = time.time()
    booster, threshold, floor, card = train_and_backtest(log)
    store.ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    booster.save_model(str(store.MODEL_PATH))
    store.META_PATH.write_text(json.dumps({
        "engineVersion": store.ENGINE_VERSION,
        "threshold": threshold,
        "earsSigmaFloor": floor,
        "features": NAMES,
        "builtAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }, indent=2))
    store.CARD_PATH.write_text(json.dumps(card, indent=2, ensure_ascii=False))
    model = RiskModel(booster, threshold, floor)
    for scn in SCENARIOS.values():
        store.write_pickle(store.snapshot_path(scn.id), build_world(scn, model))
    store.STATE_PATH.unlink(missing_ok=True)
    log(summary(card))
    log(f"[engine] artifacts in {store.ARTIFACTS_DIR}, snapshots in {store.SNAPSHOT_DIR} ({time.time() - t0:.1f}s)")
    return card


if __name__ == "__main__":
    build()
