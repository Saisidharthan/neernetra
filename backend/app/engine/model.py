import json
import math
from pathlib import Path

import numpy as np
import xgboost as xgb

from app.engine import ears
from app.engine.features import FEATURES, GROUPS, NAMES

GROUP_INDEX = {g: [k for k, (_, grp) in enumerate(FEATURES) if grp == g] for g in GROUPS}


def sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))


class RiskModel:
    def __init__(self, booster: xgb.Booster, threshold: float, sigma_floor: float):
        self.booster = booster
        self.threshold = threshold
        ears.SIGMA_FLOOR = sigma_floor

    @classmethod
    def load(cls, model_path: Path, meta_path: Path) -> "RiskModel":
        booster = xgb.Booster()
        booster.load_model(str(model_path))
        meta = json.loads(meta_path.read_text())
        return cls(booster, meta["threshold"], meta["earsSigmaFloor"])

    def _matrix(self, rows) -> xgb.DMatrix:
        return xgb.DMatrix(np.asarray(rows, dtype=float), feature_names=NAMES, missing=np.nan)

    def contributions(self, rows) -> np.ndarray:
        return self.booster.predict(self._matrix(rows), pred_contribs=True)

    def explain(self, row: list[float]) -> tuple[float, float, dict[str, float]]:
        contrib = self.contributions([row])[0]
        grouped = {g: float(contrib[idx].sum()) for g, idx in GROUP_INDEX.items()}
        return sigmoid(float(contrib.sum())), sigmoid(float(contrib[-1])), grouped
