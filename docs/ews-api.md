# NeerNetra early-warning engine — API contract

Shapes: `frontend/src/lib/ews.ts` is the source of truth. JSON is camelCase. Prefix: `/api/v1/ews`.
Dates are ISO `yyyy-mm-dd` in **simulated time** (the sim clock), not wall-clock time.

## Endpoints

| Method | Path | Body / query | Returns |
|---|---|---|---|
| GET | `/state` | — | `SimState` |
| GET | `/scenarios` | — | `Scenario[]` |
| POST | `/sim/reset` | `{scenario?}` (default `monsoon_flood`) | `SimState` |
| POST | `/sim/step` | `{days?: 1..14}` (default 1) | `SimState` |
| POST | `/sim/inject` | `{type: InjectType, villageId}` | `SimState` |
| GET | `/villages` | — | `VillageSummary[]` sorted by `rank` |
| GET | `/villages/{id}` | — | `VillageDetail` (404 if unknown) |
| GET | `/alerts` | `?status=active\|all` (active = active + acknowledged) | `Alert[]` newest first |
| POST | `/alerts/{id}/ack` | — | `Alert` |
| POST | `/alerts/{id}/resolve` | — | `Alert` |
| GET | `/notifications` | `?limit=50&role=&villageId=` | `OutboundNotification[]` newest first |
| GET | `/interventions` | `?villageId=` | `Intervention[]` newest first |
| POST | `/interventions` | `{villageId, type, assignedTo?, notes?}` | `Intervention` |
| PATCH | `/interventions/{id}` | `{status, verification?}` | `Intervention` |
| POST | `/reports` | `CaseReportInput` | `CaseReport` (same `clientId` twice → returns the existing one) |
| POST | `/reports/batch` | `{reports: CaseReportInput[]}` | `{accepted, duplicates}` |
| GET | `/reports` | `?villageId=&limit=50` | `CaseReport[]` newest first |
| POST | `/water-tests` | `WaterTestInput` | `WaterTest` |
| GET | `/advisory/{villageId}` | `?lang=en\|hi\|as` | `Advisory` |
| GET | `/model-card` | — | `ModelCard` |
| GET | `/weather/{villageId}` | — | `WeatherForecast` (live Open-Meteo; `source: "unavailable"` on failure, never 5xx) |

Every mutation bumps `SimState.version`.

## Behaviour

**Pipeline, run for every village on every sim step and after any report or water test dated today:**
1. Features from the last 14 days: rainfall (1/3/7-day totals and a 3-day forecast), turbidity (last, 3-day max, change), pH, TDS, H2S positives/tests over 7 days, cases (1/3/7 days, trend), EARS C2, upstream village's contamination signal, water source, sanitation, season.
2. EARS C1/C2/C3 (CDC) on daily syndromic case totals. C2: 7-day baseline with a 2-day guard band, flag at C2 ≥ 3. C3: sum of max(0, C2 − 1) over the last 3 days, flag at ≥ 2.
3. XGBoost → `risk` = P(outbreak within the next 7 days). Explanation = TreeSHAP (`pred_contribs=True`), grouped into human factors.
4. Tier:
   - `outbreak`: EARS flagged AND risk ≥ threshold, OR 3-day cases ≥ the outbreak case threshold
   - `warning`: risk ≥ threshold OR EARS flagged
   - `watch`: risk ≥ 0.5 × threshold, OR a water anomaly (turbidity > 10 NTU, or an **uncleared H2S positive**: a positive within 7 days with no all-negative retest since)
   - `normal`: otherwise
5. Alerts: at most one open alert per village; escalation upgrades it. Every new or escalated alert writes `OutboundNotification`s (title + body):
   - watch → ASHA
   - warning → ASHA + PHC + Citizens (boil-water notice, in the village language)
   - outbreak → + DHO; citizen notifications are `priority: high`
   - Channel is `push` for ASHA and Citizens (the field apps raise device notifications) and `in_app` for PHC and DHO (dashboard inbox). **No SMS or IVR** (no DLT registration).
   An alert auto-resolves after 3 consecutive `normal` days.
6. Advisory:
   - `do_not_drink`: tier outbreak with an uncleared H2S positive
   - `boil`: tier ≥ warning, OR an active `boil_advisory` intervention, OR an uncleared H2S positive
   - `safe`: otherwise
7. Recommended actions come from rules on the explanation, e.g.:
   - H2S positive → chlorination
   - cases rising → medical camp + ORS
   - upstream at risk → source testing

**Interventions change the simulation (closed loop):**
- `dispatched` → `in_progress` on the next step → `completed` on the step after, with a `verification` string.
- `chlorination` cuts contamination sharply from `in_progress` onward.
- `boil_advisory` cuts exposure.
- `medical_camp` / `ors_distribution` reduce severity and increase reporting.

**Scenarios (deterministic given the same actions):**
- `monsoon_flood` (default): cloudburst over the upstream end of a river catchment on day 2. Contamination cascades downstream, and without action 2–3 villages reach `outbreak` around days 5–8.
- `pipe_burst`: dry weather; a pipeline leak contaminates one piped-supply village. Shows the model is not "just rain".
- `calm`: dry-season baseline. Demonstrates a low false-alarm rate.

**Reporting** happens only through the apps (ASHA, citizen, PHC). The ASHA app queues reports offline and syncs them later (`channel: offline_sync`).

**Data is synthetic.** Four years of simulated history train the model (the last year is held out for the model card). `/model-card` numbers are computed from that backtest, never hard-coded.
