"""CDC Early Aberration Reporting System (EARS) C1/C2/C3 on daily syndromic case totals."""
import math

BASELINE_DAYS = 7
C2_GUARD = 2
C2_FLAG = 3.0
C3_FLAG = 2.0
SIGMA_FLOOR = 1.0


def _c(cases: list[int], t: int, guard: int) -> float:
    lo, hi = t - guard - BASELINE_DAYS, t - guard
    if t < 0 or hi - max(lo, 0) < 3:
        return 0.0
    base = cases[max(lo, 0):hi]
    mean = sum(base) / len(base)
    sd = math.sqrt(sum((x - mean) ** 2 for x in base) / (len(base) - 1))
    return (cases[t] - mean) / max(sd, SIGMA_FLOOR)


def c1(cases: list[int], t: int) -> float:
    return _c(cases, t, 0)


def c2(cases: list[int], t: int) -> float:
    return _c(cases, t, C2_GUARD)


def c3(cases: list[int], t: int) -> float:
    return sum(max(0.0, c2(cases, t - k) - 1) for k in range(3))


def scores(cases: list[int], t: int) -> tuple[float, float, float, bool]:
    s1, s2, s3 = c1(cases, t), c2(cases, t), c3(cases, t)
    return s1, s2, s3, s2 >= C2_FLAG or s3 >= C3_FLAG
