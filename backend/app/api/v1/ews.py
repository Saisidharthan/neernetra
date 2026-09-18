import datetime as dt
from typing import List, Literal, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.engine import views, weather
from app.engine.scenarios import DEFAULT_SCENARIO, SCENARIOS
from app.engine.service import service
from app.engine.villages import BY_ID, INDEX

router = APIRouter(prefix="/ews", tags=["NeerNetra Early Warning Engine"])

InterventionType = Literal["chlorination", "boil_advisory", "medical_camp", "ors_distribution", "source_testing", "awareness_drive"]
InterventionStatus = Literal["dispatched", "in_progress", "completed"]


class ResetIn(BaseModel):
    scenario: Optional[str] = None


class StepIn(BaseModel):
    days: int = Field(1, ge=1, le=14)


class InjectIn(BaseModel):
    type: Literal["heavy_rain", "pipe_burst", "sewage_overflow"]
    villageId: str


class InterventionIn(BaseModel):
    villageId: str
    type: InterventionType
    assignedTo: Optional[str] = None
    notes: Optional[str] = None


class InterventionPatch(BaseModel):
    status: InterventionStatus
    verification: Optional[str] = None


class SymptomsIn(BaseModel):
    diarrhoea: int = Field(0, ge=0)
    vomiting: int = Field(0, ge=0)
    fever: int = Field(0, ge=0)
    jaundice: int = Field(0, ge=0)
    bloodyStool: int = Field(0, ge=0)


class CaseReportIn(BaseModel):
    villageId: str
    reporterRole: Literal["asha", "citizen", "clinic"]
    reporterName: Optional[str] = None
    channel: Literal["app", "offline_sync"]
    date: Optional[dt.date] = None
    symptoms: SymptomsIn
    notes: Optional[str] = None
    clientId: Optional[str] = None


class ReportBatchIn(BaseModel):
    reports: List[CaseReportIn]


class WaterTestIn(BaseModel):
    villageId: str
    source: Literal["sensor", "h2s_kit", "field_kit", "citizen"]
    date: Optional[dt.date] = None
    h2sPositive: Optional[bool] = None
    turbidity: Optional[float] = Field(None, ge=0)
    ph: Optional[float] = Field(None, ge=0, le=14)
    appearance: Optional[Literal["clear", "cloudy", "muddy"]] = None
    notes: Optional[str] = None
    clientId: Optional[str] = None


def _village(vid: str) -> int:
    if vid not in INDEX:
        raise HTTPException(status_code=404, detail=f"Unknown village '{vid}'.")
    return INDEX[vid]


def _dated(payload: BaseModel) -> dict:
    world = service.world
    _village(payload.villageId)
    data = payload.model_dump()
    data["date"] = data["date"] or world.today_date
    if data["date"] > world.today_date:
        raise HTTPException(status_code=400, detail=f"Date {data['date']} is after the current sim date {world.today_date}.")
    if data["date"] < world.book.start:
        raise HTTPException(status_code=400, detail=f"Date {data['date']} is before the simulation history starts ({world.book.start}).")
    return data


def _find(items: list[dict], item_id: int, kind: str) -> dict:
    found = next((x for x in items if x["id"] == item_id), None)
    if found is None:
        raise HTTPException(status_code=404, detail=f"Unknown {kind} {item_id}.")
    return found


@router.get("/state")
def get_state():
    with service.lock:
        return views.sim_state(service.world)


@router.get("/scenarios")
def get_scenarios():
    return [{"id": s.id, "label": s.label, "description": s.description} for s in SCENARIOS.values()]


@router.post("/sim/reset")
def reset_sim(body: Optional[ResetIn] = None):
    scenario = (body.scenario if body else None) or DEFAULT_SCENARIO
    if scenario not in SCENARIOS:
        raise HTTPException(status_code=400, detail=f"Unknown scenario '{scenario}'. Choose one of: {', '.join(SCENARIOS)}.")
    with service.lock:
        return views.sim_state(service.reset(scenario))


@router.post("/sim/step")
def step_sim(body: Optional[StepIn] = None):
    with service.lock:
        service.world.step(service.model, body.days if body else 1)
        service.save()
        return views.sim_state(service.world)


@router.post("/sim/inject")
def inject_event(body: InjectIn):
    _village(body.villageId)
    with service.lock:
        service.world.inject(body.type, body.villageId)
        service.save()
        return views.sim_state(service.world)


@router.get("/villages")
def get_villages():
    with service.lock:
        return views.village_summaries(service.world)


@router.get("/villages/{village_id}")
def get_village(village_id: str):
    i = _village(village_id)
    with service.lock:
        return views.village_detail(service.world, i, service.model.threshold)


@router.get("/alerts")
def get_alerts(status: Literal["active", "all"] = "active"):
    with service.lock:
        alerts = [a for a in service.world.alerts if status == "all" or a["status"] != "resolved"]
        return sorted(alerts, key=lambda a: (a["updatedDate"], a["id"]), reverse=True)


@router.post("/alerts/{alert_id}/ack")
def ack_alert(alert_id: int):
    with service.lock:
        alert = service.world.ack_alert(_find(service.world.alerts, alert_id, "alert"))
        service.save()
        return alert


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int):
    with service.lock:
        alert = service.world.resolve_alert(_find(service.world.alerts, alert_id, "alert"))
        service.save()
        return alert


@router.get("/notifications")
def get_notifications(
    limit: int = Query(50, ge=1, le=1000),
    role: Optional[Literal["ASHA", "PHC", "DHO", "Citizens"]] = None,
    villageId: Optional[str] = None,
):
    with service.lock:
        rows = [n for n in service.world.notifications
                if (role is None or n["role"] == role) and (villageId is None or n["villageId"] == villageId)]
        return sorted(rows, key=lambda n: n["id"], reverse=True)[:limit]


@router.get("/interventions")
def get_interventions(villageId: Optional[str] = None):
    with service.lock:
        rows = [iv for iv in service.world.interventions if villageId is None or iv["villageId"] == villageId]
        return [views.public(iv) for iv in sorted(rows, key=lambda iv: iv["id"], reverse=True)]


@router.post("/interventions")
def create_intervention(body: InterventionIn):
    _village(body.villageId)
    with service.lock:
        iv = service.world.create_intervention(service.model, body.villageId, body.type, body.assignedTo, body.notes)
        service.save()
        return views.public(iv)


@router.patch("/interventions/{intervention_id}")
def update_intervention(intervention_id: int, body: InterventionPatch):
    with service.lock:
        iv = _find(service.world.interventions, intervention_id, "intervention")
        iv = service.world.update_intervention(service.model, iv, body.status, body.verification)
        service.save()
        return views.public(iv)


@router.post("/reports")
def submit_report(body: CaseReportIn):
    with service.lock:
        report, _ = service.world.add_report(service.model, _dated(body))
        service.save()
        return report


@router.post("/reports/batch")
def submit_reports(body: ReportBatchIn):
    with service.lock:
        rows = [_dated(r) for r in body.reports]
        created = [service.world.add_report(service.model, r)[1] for r in rows]
        service.save()
        return {"accepted": sum(created), "duplicates": len(created) - sum(created)}


@router.get("/reports")
def get_reports(villageId: Optional[str] = None, limit: int = Query(50, ge=1, le=1000)):
    with service.lock:
        rows = [r for r in service.world.reports if villageId is None or r["villageId"] == villageId]
        return sorted(rows, key=lambda r: (r["date"], r["id"]), reverse=True)[:limit]


@router.post("/water-tests")
def submit_water_test(body: WaterTestIn):
    with service.lock:
        test, _ = service.world.add_water_test(service.model, _dated(body))
        service.save()
        return test


@router.get("/advisory/{village_id}")
def get_advisory(village_id: str, lang: Literal["en", "hi", "as"] = "en"):
    i = _village(village_id)
    with service.lock:
        return views.advisory(service.world, i, lang)


@router.get("/model-card")
def get_model_card():
    return service.card


@router.get("/weather/{village_id}")
def get_weather(village_id: str):
    _village(village_id)
    return weather.forecast(BY_ID[village_id])
