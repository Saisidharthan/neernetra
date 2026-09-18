# NeerNetra ("the water eye")

Village-level early warning for water-borne illness (cholera, typhoid, diarrhoeal disease, hepatitis A/E).
Track: **Social Impact — Community Water-Borne Illness & Outbreak Early Warning**.

NeerNetra warns a district **before** case counts spike. It watches rain, water quality and ASHA reports for every village, and follows contamination downstream along the river.

> **Hackathon prototype.** The district, villages and four years of history are simulated. The model is trained and backtested on that synthetic data. Treat the numbers on `/model` as a check of the method, not a field result.

## What it does

| Layer | How |
|---|---|
| Detect (statistics) | CDC EARS C1/C2/C3 on daily syndromic case counts per village |
| Predict (ML) | XGBoost: P(outbreak in the next 7 days) from rainfall and forecast, turbidity, pH/TDS, H2S strips, cases, the upstream village and season |
| Explain | Real TreeSHAP attributions (`pred_contribs`), grouped into plain-language factors on each village page |
| Spread | Villages sit on a river network, so upstream contamination raises downstream risk |
| Alert | Tiers normal → watch → warning → outbreak. Push notifications to ASHA and citizen apps in Assamese, Hindi and English; in-app notifications for PHC and DHO. No SMS. |
| Act | Dispatch chlorination, a boil-water advisory, a medical camp or ORS. Interventions feed back into the simulation, so risk falls and the advisory returns to safe. |
| Field | ASHA app works offline (IndexedDB queue, auto-sync, de-duplicated), plus a citizen advisory page and a PHC clinic desk |

## Run

```bash
./dev.sh
```

- Needs `uv` and Node 18+.
- Backend: `:8000`. Frontend: http://localhost:3000.
- The first start builds four years of history and trains and backtests the model (~15 s).

Or run the two halves separately:

```bash
cd backend && uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8000          # API + engine
.venv/bin/python -m app.engine.build                 # force a rebuild (restart the server after)

cd frontend && npm install && npm run dev
```

## 3-minute demo

Open `/simulation` (Demo). It has a presenter checklist; drive time with the bar at the top.

1. **Day 0:** everything green. Point at the river links on the Command Center map.
2. **Day 2:** a cloudburst over Ukiam at the head of the Kulsi river. NeerNetra warns villages before a single case.
3. **Day 3:** turbidity and H2S jump downstream. Open the top village: ML is firing while EARS is still quiet. That gap is the lead time.
4. `/inbox`: the alert lands on the ASHA and citizen phones in Assamese.
5. Dispatch chlorination and a boil advisory at Kukurmara on day 2. Acting at the first warning prevents the outbreak; acting after the case spike doesn't.
6. Keep stepping: risk falls and the advisory flips back to safe.
7. `/model`: backtest against EARS alone, the lead-time histogram, and the synthetic-data disclaimer.

Other scenarios:
- `pipe_burst`: a dry-season sewage leak, which shows the model isn't just a rain alarm.
- `calm`: the false-alarm baseline.
- **Inject** adds an event live.

## Layout

```
backend/app/engine/     simulator, EARS, features, XGBoost + TreeSHAP, backtest, tiers, alerts, notifications
backend/app/api/v1/ews.py   /api/v1/ews/* (contract: docs/ews-api.md)
frontend/src/lib/ews.ts     typed client (source of truth for response shapes)
frontend/src/app/           command centre, village, demo, alerts, water, model, ASHA, citizen, PHC, inbox
```

## Credits

Built on [ArogyaPurvottar](https://github.com/HARISHPG21/-Arogya-Purvottar) by HARISHPG21 (MIT, per its README): the Next.js/FastAPI scaffold, multilingual strings, the offline storage idea and the role portals.

NeerNetra replaces its formula-based predictor with the trained and backtested engine above. It also fixes these bugs in the base repo:
- the missing `app/models`
- class-based dark mode
- a hydration error on `/ai-assistant`
