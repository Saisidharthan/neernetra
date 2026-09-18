"""The live simulated district: sim clock, observations, scoring pipeline, alerts, outbound
messages and interventions that feed back into the simulator."""
import math
from datetime import date

import numpy as np

from app.engine import ears
from app.engine.book import Book, ingest
from app.engine.climate import Climate
from app.engine.features import GROUP_LABELS, GROUP_PHRASES, describe, feature_row, h2s_uncleared, last_h2s_positive
from app.engine.model import RiskModel
from app.engine.simulator import CHLORINATION_DAYS, CHLORINATION_FACTOR, Effects, Simulator
from app.engine.templates import ASHA, CITIZENS, DHO_BODY, DHO_TITLE, PHC_BODY, PHC_TITLE, TIER_TITLES
from app.engine.tiers import ANOMALY_NTU, TIER_ORDER, advisory_for, tier_for
from app.engine.villages import DHO, INDEX, VILLAGES

SYMPTOM_KEYS = ["diarrhoea", "vomiting", "fever", "jaundice", "bloodyStool"]
ALERT_MIN_DAY = 14
AUDIENCE = {
    "watch": ["ASHA"],
    "warning": ["ASHA", "PHC", "Citizens"],
    "outbreak": ["ASHA", "PHC", "Citizens", "DHO"],
}
EFFECT_DAYS = {
    "chlorination": CHLORINATION_DAYS,
    "boil_advisory": 21,
    "medical_camp": 7,
    "ors_distribution": 10,
    "source_testing": 2,
    "awareness_drive": 21,
}
DEFAULT_ASSIGNEE = {
    "chlorination": "PHED water-quality team",
    "boil_advisory": "ASHA {asha}",
    "medical_camp": "{phc} rapid response team",
    "ors_distribution": "ASHA {asha}",
    "source_testing": "District water-testing lab",
    "awareness_drive": "ASHA {asha}",
}


class World:
    def __init__(self, scenario: str, label: str, climate: Climate, sim: Simulator):
        self.scenario = scenario
        self.scenario_label = label
        self.climate = climate
        self.sim = sim
        self.book = Book(climate.start)
        self.day0 = 0
        self.version = 1
        self.narration: str | None = None
        self.reports: list[dict] = []
        self.tests: list[dict] = []
        self.alerts: list[dict] = []
        self.notifications: list[dict] = []
        self.interventions: list[dict] = []
        self.report_clients: dict[str, dict] = {}
        self.test_clients: dict[str, dict] = {}
        self.ids = {"report": 0, "test": 0, "alert": 0, "notification": 0, "intervention": 0}
        self.explanations: dict[int, dict] = {}
        self.beats: list[tuple[int, str]] = []

    # clock

    @property
    def today(self) -> int:
        return self.book.today

    @property
    def today_date(self) -> date:
        return self.book.date_of(self.today)

    @property
    def day_of_scenario(self) -> int:
        return self.today - self.day0

    def _next_id(self, kind: str) -> int:
        self.ids[kind] += 1
        return self.ids[kind]

    def step(self, model: RiskModel, days: int):
        best = (-1, "")
        for _ in range(days):
            self.advance_day(model)
            priority = max((p for p, _ in self.beats), default=0)
            if priority >= best[0]:
                best = (priority, self._narrate())
        self.narration = best[1]
        self.version += 1

    def advance_day(self, model: RiskModel):
        d = self.book.days
        self.beats = []
        self._progress_interventions(d)
        obs = self.sim.advance(self._effects(d))
        chlor = {INDEX[iv["villageId"]]: d - iv["_start"] for iv in self.interventions
                 if iv["type"] == "chlorination" and self._in_effect(iv, d)}
        self.book.open_day([o.rain for o in obs], self.climate.forecast(d), [o.onsets for o in obs], chlor)
        for i, o in enumerate(obs):
            ingest(self.book, i, d, o, on_test=self._sim_test, on_report=self._sim_report)
            if self.climate.is_burst(d, i):
                self.beats.append((3, f"Cloudburst over {VILLAGES[i].name}: {o.rain:.0f} mm in 24 h."))
            for kind in o.events:
                if not any(e.kind == kind and e.village == i and e.start < d for e in self.sim.events):
                    self.beats.append((3, f"{kind.replace('_', ' ').capitalize()} at {VILLAGES[i].name}."))
        for i in range(len(VILLAGES)):
            self.score(model, i, d)

    def _narrate(self) -> str:
        dt = self.today_date
        head = f"Day {self.day_of_scenario} · {dt.strftime('%d %b')}:"
        if not self.beats:
            at_risk = sum(1 for s in self.book.series if TIER_ORDER[s.tier[self.today]] >= TIER_ORDER["warning"])
            tail = f"{at_risk} village{'s' if at_risk != 1 else ''} still at warning or above." if at_risk else "All villages stable."
            return f"{head} {tail}"
        beats = [b for _, b in sorted(self.beats, key=lambda x: -x[0])]
        return f"{head} {' '.join(beats[:2])}"

    def inject(self, kind: str, vid: str):
        i = INDEX[vid]
        v = VILLAGES[i]
        d = self.today + 1
        if kind == "heavy_rain":
            rng = np.random.default_rng([self.sim.seed, d, i + 1, 88])
            for j, w in enumerate(VILLAGES):
                share = 1.0 if j == i else (rng.uniform(0.3, 0.55) if v.catchment and w.catchment == v.catchment else 0.0)
                if share:
                    self.climate.set_rain(d, j, max(float(self.climate.rain(d)[j]), 150.0 * share))
        elif kind == "pipe_burst":
            self.sim.add_event("pipe_burst", i, d, 5, 2.4, 18.0)
        else:
            self.sim.add_event("sewage_overflow", i, d, 3, 1.2, 5.0)
        what = {"heavy_rain": "Very heavy rain", "pipe_burst": "A pipeline burst", "sewage_overflow": "A sewage overflow"}[kind]
        self.narration = f"Day {self.day_of_scenario} · {self.today_date.strftime('%d %b')}: {what} will hit {v.name} tomorrow. Step the simulation to see NeerNetra respond."
        self.version += 1

    # interventions

    def _progress_interventions(self, d: int):
        dt = self.book.date_of(d)
        for iv in self.interventions:
            if iv["status"] == "in_progress":
                iv["status"] = "completed"
                iv["updatedDate"] = dt.isoformat()
                iv["verification"] = iv["verification"] or self._verification(iv, d)
                self.beats.append((1, f"{iv['type'].replace('_', ' ').capitalize()} completed in {iv['villageName']}."))
            elif iv["status"] == "dispatched":
                iv["status"] = "in_progress"
                iv["updatedDate"] = dt.isoformat()
                iv["_start"] = d
                self.beats.append((1, f"{iv['type'].replace('_', ' ').capitalize()} under way in {iv['villageName']}."))

    def _in_effect(self, iv: dict, d: int) -> bool:
        return iv["status"] != "dispatched" and "_start" in iv and 0 <= d - iv["_start"] < EFFECT_DAYS[iv["type"]]

    def _effects(self, d: int) -> dict[int, Effects]:
        out: dict[int, Effects] = {}
        for iv in self.interventions:
            if not self._in_effect(iv, d):
                continue
            e = out.setdefault(INDEX[iv["villageId"]], Effects())
            age = d - iv["_start"]
            kind = iv["type"]
            if kind == "chlorination":
                e.chlorination = CHLORINATION_FACTOR
                e.extra_tests += int(age in (0, 2))
            elif kind == "boil_advisory":
                e.boil = max(e.boil, 0.6 if age < 10 else 0.3)
            elif kind == "medical_camp":
                e.report_boost += 0.3
                e.secondary_cut = max(e.secondary_cut, 0.5)
            elif kind == "ors_distribution":
                e.report_boost += 0.1
                e.secondary_cut = max(e.secondary_cut, 0.3)
            elif kind == "source_testing":
                e.extra_tests += 2
            elif kind == "awareness_drive":
                e.exposure_cut = max(e.exposure_cut, 0.15)
                e.report_boost += 0.1
        return out

    def _verification(self, iv: dict, d: int) -> str:
        i = INDEX[iv["villageId"]]
        v = VILLAGES[i]
        rng = np.random.default_rng([self.sim.seed, d, i + 1, 77, iv["id"]])
        kind = iv["type"]
        if kind == "chlorination":
            n = int(rng.integers(3, 7))
            return f"Residual free chlorine {rng.uniform(0.4, 0.9):.1f} mg/L at {n} of {n} sampled households"
        if kind == "boil_advisory":
            return f"Boil-water notice pushed to the NeerNetra app and delivered to {v.population // 5:,} households by ASHA visits"
        if kind == "medical_camp":
            screened = int(rng.integers(30, 90))
            return f"Camp at {v.phc}: {screened} people screened, {screened // 3} ORS kits issued, {int(rng.integers(0, 4))} referred"
        if kind == "ors_distribution":
            households = int(rng.integers(120, 260))
            return f"{households * 3} ORS sachets and zinc distributed to {households} households"
        if kind == "source_testing":
            recent = [t for t in self.tests if t["villageId"] == v.id and t["h2sPositive"] is not None][-4:]
            pos = sum(1 for t in recent if t["h2sPositive"])
            return f"{len(recent)} source samples tested: {pos} H2S positive"
        return f"Hygiene sessions in {int(rng.integers(3, 7))} wards, {int(rng.integers(150, 400))} attendees"

    def boil_active(self, vid: str) -> bool:
        return any(iv["villageId"] == vid and iv["type"] == "boil_advisory" and iv["status"] in ("dispatched", "in_progress")
                   for iv in self.interventions)

    def intervention_active(self, vid: str, kind: str) -> bool:
        return any(iv["villageId"] == vid and iv["type"] == kind and (iv["status"] == "dispatched" or self._in_effect(iv, self.today))
                   for iv in self.interventions)

    def create_intervention(self, model: RiskModel, vid: str, kind: str, assigned_to: str | None, notes: str | None) -> dict:
        v = VILLAGES[INDEX[vid]]
        iv = {
            "id": self._next_id("intervention"),
            "villageId": vid,
            "villageName": v.name,
            "type": kind,
            "status": "dispatched",
            "createdDate": self.today_date.isoformat(),
            "updatedDate": self.today_date.isoformat(),
            "assignedTo": assigned_to or DEFAULT_ASSIGNEE[kind].format(asha=v.asha, phc=v.phc),
            "notes": notes,
            "verification": None,
        }
        self.interventions.append(iv)
        self.score(model, INDEX[vid], self.today)
        self.version += 1
        return iv

    def update_intervention(self, model: RiskModel, iv: dict, status: str, verification: str | None) -> dict:
        if status != "dispatched" and "_start" not in iv:
            iv["_start"] = self.today
        iv["status"] = status
        iv["updatedDate"] = self.today_date.isoformat()
        if verification:
            iv["verification"] = verification
        elif status == "completed" and not iv["verification"]:
            iv["verification"] = self._verification(iv, self.today)
        self.score(model, INDEX[iv["villageId"]], self.today)
        self.version += 1
        return iv

    # observations -> records

    def _sim_test(self, i: int, d: int, t: dict):
        v = VILLAGES[i]
        notes = {
            "sensor": f"IoT probe, TDS {t['tds']:.0f} mg/L" if t["tds"] is not None else "IoT probe",
            "h2s_kit": f"ASHA {v.asha}, field kit" if t["turbidity"] is not None else f"ASHA {v.asha}, H2S strip",
            "citizen": "Citizen report via app",
        }[t["source"]]
        self.tests.append({
            "id": self._next_id("test"),
            "villageId": v.id,
            "date": self.book.date_of(d).isoformat(),
            "source": t["source"],
            "h2sPositive": t["h2s"],
            "turbidity": t["turbidity"],
            "ph": t["ph"],
            "appearance": t["appearance"],
            "notes": notes,
        })

    def _sim_report(self, i: int, d: int, role: str, channel: str, symptoms: list[int]):
        v = VILLAGES[i]
        self.reports.append({
            "id": self._next_id("report"),
            "villageId": v.id,
            "reporterRole": role,
            "reporterName": v.asha if role == "asha" else v.phc,
            "channel": channel,
            "date": self.book.date_of(d).isoformat(),
            "symptoms": dict(zip(SYMPTOM_KEYS, (int(x) for x in symptoms))),
            "total": int(sum(symptoms)),
            "notes": None,
        })

    def add_report(self, model: RiskModel, data: dict) -> tuple[dict, bool]:
        cid = data.get("clientId")
        if cid and cid in self.report_clients:
            return self.report_clients[cid], False
        i = INDEX[data["villageId"]]
        d = self.book.index_of(data["date"])
        symptoms = {k: int(data["symptoms"][k]) for k in SYMPTOM_KEYS}
        report = {
            "id": self._next_id("report"),
            "villageId": data["villageId"],
            "reporterRole": data["reporterRole"],
            "reporterName": data.get("reporterName"),
            "channel": data["channel"],
            "date": data["date"].isoformat(),
            "symptoms": symptoms,
            "total": sum(symptoms.values()),
            "notes": data.get("notes"),
        }
        self.reports.append(report)
        if cid:
            self.report_clients[cid] = report
        self.book.add_cases(i, d, report["total"])
        self._rescore(model, i)
        return report, True

    def add_water_test(self, model: RiskModel, data: dict) -> tuple[dict, bool]:
        cid = data.get("clientId")
        if cid and cid in self.test_clients:
            return self.test_clients[cid], False
        i = INDEX[data["villageId"]]
        d = self.book.index_of(data["date"])
        test = {
            "id": self._next_id("test"),
            "villageId": data["villageId"],
            "date": data["date"].isoformat(),
            "source": data["source"],
            "h2sPositive": data.get("h2sPositive"),
            "turbidity": data.get("turbidity"),
            "ph": data.get("ph"),
            "appearance": data.get("appearance"),
            "notes": data.get("notes"),
        }
        self.tests.append(test)
        if cid:
            self.test_clients[cid] = test
        self.book.add_water(i, d, turbidity=test["turbidity"], ph=test["ph"], h2s=test["h2sPositive"], appearance=test["appearance"])
        self._rescore(model, i)
        return test, True

    def _rescore(self, model: RiskModel, i: int):
        self.beats = []
        self.score(model, i, self.today)
        if self.beats:
            self.narration = self._narrate()
        self.version += 1

    # scoring pipeline

    def score(self, model: RiskModel, i: int, d: int):
        v = VILLAGES[i]
        s = self.book.series[i]
        row = feature_row(self.book, i, d)
        risk, base, grouped = model.explain(row)
        c1, c2, c3, flagged = ears.scores(s.cases, d)
        cases3 = sum(s.cases[max(0, d - 2):d + 1])
        turb3 = [t for t in s.turb[max(0, d - 2):d + 1] if not math.isnan(t)]
        turb_max = max(turb3) if turb3 else None
        h2s_open = h2s_uncleared(s, d)
        anomaly = (turb_max is not None and turb_max > ANOMALY_NTU) or h2s_open
        tier = tier_for(risk, model.threshold, flagged, cases3, v.outbreak_cases_3d, anomaly)
        s.risk[d], s.c1[d], s.c2[d], s.c3[d], s.flagged[d], s.tier[d] = risk, c1, c2, c3, flagged, tier
        s.advisory[d] = advisory_for(tier, h2s_open, self.boil_active(v.id))
        self.explanations[i] = {"d": d, "row": row, "risk": risk, "base": base, "grouped": grouped, "threshold": model.threshold}
        triggers = []
        if risk >= model.threshold:
            triggers.append(f"ML risk {risk:.2f} >= {model.threshold:.2f}")
        elif risk >= 0.5 * model.threshold:
            triggers.append(f"ML risk {risk:.2f} >= {0.5 * model.threshold:.2f}")
        if c2 >= ears.C2_FLAG:
            triggers.append(f"EARS C2 = {c2:.1f}")
        if c3 >= ears.C3_FLAG:
            triggers.append(f"EARS C3 = {c3:.1f}")
        if cases3 >= v.outbreak_cases_3d:
            triggers.append(f"{cases3} cases in 3 days >= {v.outbreak_cases_3d}")
        if turb_max is not None and turb_max > ANOMALY_NTU:
            triggers.append(f"Turbidity {turb_max:.1f} NTU > {ANOMALY_NTU:.0f}")
        if h2s_open:
            triggers.append(f"H2S positive on {self.book.date_of(last_h2s_positive(s, d)).isoformat()}, not yet cleared by a negative retest")
        if d >= ALERT_MIN_DAY:
            self._update_alert(i, d, tier, triggers, cases3, risk, flagged)

    def summary(self, i: int) -> str:
        ex = self.explanations[i]
        v = VILLAGES[i]
        factors = self.factors(i)
        drivers = [f for f in factors if f["contribution"] > 0.05][:2]
        brake = next((f for f in factors if f["contribution"] < -1.0), None)
        risk = ex["risk"]
        s = self.book.series[i]
        threshold = ex["threshold"]
        phrase = lambda f: f"{GROUP_PHRASES[f['key']]} ({f['value']})"
        level = "High" if risk >= threshold else ("Elevated" if risk >= 0.5 * threshold else "Low")
        text = f"{level} outbreak risk ({risk:.0%}) in {v.name}"
        if drivers and level != "Low":
            text += ", driven by " + " and ".join(phrase(f) for f in drivers)
        text += "."
        if brake and risk < threshold:
            text = text[:-1] + f"; {phrase(brake)} is holding it down."
        if s.flagged[ex["d"]]:
            text += f" EARS flags a case spike (C2 {s.c2[ex['d']]:.1f}, C3 {s.c3[ex['d']]:.1f})."
        return text

    def factors(self, i: int) -> list[dict]:
        ex = self.explanations[i]
        total = sum(abs(c) for c in ex["grouped"].values()) or 1.0
        out = [{
            "key": g,
            "label": GROUP_LABELS[g],
            "value": describe(g, ex["row"], i, ex["d"], self.book),
            "contribution": round(c, 4),
            "share": round(abs(c) / total, 4),
        } for g, c in ex["grouped"].items()]
        return sorted(out, key=lambda f: -abs(f["contribution"]))

    def _update_alert(self, i: int, d: int, tier: str, triggers: list[str], cases3: int, risk: float, flagged: bool):
        v = VILLAGES[i]
        dt = self.book.date_of(d).isoformat()
        alert = next((a for a in self.alerts if a["villageId"] == v.id and a["status"] != "resolved"), None)
        if tier == "normal":
            tiers = self.book.series[i].tier
            if alert and d >= 2 and all(t == "normal" for t in tiers[d - 2:d + 1]):
                alert["status"] = "resolved"
                alert["updatedDate"] = dt
                self._send_clear(alert, i, d)
                self.beats.append((1, f"Alert closed in {v.name} after 3 normal days."))
            return
        if alert and TIER_ORDER[tier] <= TIER_ORDER[alert["tier"]]:
            return
        summary = self.summary(i)
        if alert is None:
            alert = {"id": self._next_id("alert"), "villageId": v.id, "villageName": v.name, "createdDate": dt}
            self.alerts.append(alert)
        alert.update({
            "tier": tier,
            "status": "active",
            "updatedDate": dt,
            "title": f"{TIER_TITLES[tier]}: {v.name} ({v.id})",
            "message": summary,
            "triggers": triggers,
            "audience": AUDIENCE[tier],
        })
        self._send_alert(alert, i, d, tier, triggers, cases3, risk, summary)
        if tier == "outbreak":
            self.beats.append((6, f"{v.name} escalates to OUTBREAK: {cases3} cases in 3 days."))
        elif tier == "warning":
            top = next((f for f in self.factors(i) if f["contribution"] > 0), None)
            if flagged:
                self.beats.append((5, f"NeerNetra warns {v.name} (risk {risk:.2f}) on a case spike."))
            else:
                detail = f"; top signal is {GROUP_PHRASES[top['key']]} — {top['value']}" if top else ""
                self.beats.append((5, f"NeerNetra warns {v.name} (risk {risk:.2f}) before any case spike{detail}."))
        else:
            self.beats.append((2, f"{v.name} on watch ({self._reason(i, d, risk)})."))

    def _reason(self, i: int, d: int, risk: float) -> str:
        s = self.book.series[i]
        turb = [t for t in s.turb[max(0, d - 2):d + 1] if not math.isnan(t)]
        if h2s_uncleared(s, d):
            return "H2S test positive"
        if turb and max(turb) > ANOMALY_NTU:
            return f"turbidity {max(turb):.0f} NTU"
        return f"outbreak risk {round(risk * 100)}%"

    def _notify(self, d: int, role: str, to: str, lang: str, title: str, body: str, vid: str, alert_id: int, priority: str = "normal"):
        self.notifications.append({
            "id": self._next_id("notification"),
            "date": self.book.date_of(d).isoformat(),
            "channel": "push" if role in ("ASHA", "Citizens") else "in_app",
            "role": role,
            "to": to,
            "language": lang,
            "priority": priority,
            "title": title,
            "body": body,
            "villageId": vid,
            "alertId": alert_id,
        })

    def _send_alert(self, alert: dict, i: int, d: int, tier: str, triggers: list[str], cases3: int, risk: float, summary: str):
        v = VILLAGES[i]
        lang = v.language
        reason = self._reason(i, d, risk)
        fmt = {"village": v.name, "reason": reason[0].upper() + reason[1:], "risk": round(risk * 100), "cases": cases3, "asha": v.asha, "phc": v.phc}
        self._notify(d, "ASHA", f"ASHA {v.asha} (NeerNetra app)", lang,
                     ASHA[tier]["title"][lang].format(**fmt), ASHA[tier]["body"][lang].format(**fmt), v.id, alert["id"])
        if tier == "watch":
            return
        self._notify(d, "PHC", f"MO {v.medical_officer}, {v.phc} (NeerNetra dashboard)", "en",
                     PHC_TITLE.format(tier=TIER_TITLES[tier], village=v.name, vid=v.id),
                     PHC_BODY.format(summary=summary, triggers="; ".join(triggers)), v.id, alert["id"])
        self._notify(d, "Citizens", f"Citizens of {v.name} (NeerNetra app)", lang,
                     CITIZENS[tier]["title"][lang].format(**fmt), CITIZENS[tier]["body"][lang].format(**fmt), v.id, alert["id"],
                     "high" if tier == "outbreak" else "normal")
        if tier == "outbreak":
            self._notify(d, "DHO", f"{DHO[v.district]} (NeerNetra dashboard)", "en",
                         DHO_TITLE.format(village=v.name, vid=v.id, district=v.district),
                         DHO_BODY.format(cases=cases3, risk=f"{risk:.2f}", summary=summary), v.id, alert["id"])

    def _send_clear(self, alert: dict, i: int, d: int):
        v = VILLAGES[i]
        lang = v.language
        title = CITIZENS["clear"]["title"][lang].format(village=v.name)
        body = CITIZENS["clear"]["body"][lang]
        self._notify(d, "ASHA", f"ASHA {v.asha} (NeerNetra app)", lang, title, body, v.id, alert["id"])
        if alert["tier"] != "watch":
            self._notify(d, "Citizens", f"Citizens of {v.name} (NeerNetra app)", lang, title, body, v.id, alert["id"])

    def ack_alert(self, alert: dict) -> dict:
        if alert["status"] == "active":
            alert["status"] = "acknowledged"
            alert["updatedDate"] = self.today_date.isoformat()
        self.version += 1
        return alert

    def resolve_alert(self, alert: dict) -> dict:
        alert["status"] = "resolved"
        alert["updatedDate"] = self.today_date.isoformat()
        self.version += 1
        return alert
