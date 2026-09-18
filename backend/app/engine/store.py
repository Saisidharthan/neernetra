import json
import os
import pickle
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
ARTIFACTS_DIR = BACKEND_DIR / "artifacts"
DATA_DIR = BACKEND_DIR / "data"
SNAPSHOT_DIR = DATA_DIR / "snapshots"
MODEL_PATH = ARTIFACTS_DIR / "model.json"
META_PATH = ARTIFACTS_DIR / "meta.json"
CARD_PATH = ARTIFACTS_DIR / "model_card.json"
STATE_PATH = DATA_DIR / "ews_state.pkl"
ENGINE_VERSION = "4"


def snapshot_path(scenario: str) -> Path:
    return SNAPSHOT_DIR / f"{scenario}.pkl"


def ready(scenarios) -> bool:
    if not all(p.exists() for p in (MODEL_PATH, META_PATH, CARD_PATH)):
        return False
    if json.loads(META_PATH.read_text()).get("engineVersion") != ENGINE_VERSION:
        return False
    return all(snapshot_path(s).exists() for s in scenarios)


def write_pickle(path: Path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    with open(tmp, "wb") as f:
        pickle.dump(obj, f, protocol=pickle.HIGHEST_PROTOCOL)
    os.replace(tmp, path)


def read_pickle(path: Path):
    with open(path, "rb") as f:
        return pickle.load(f)
