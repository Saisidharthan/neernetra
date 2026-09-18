#!/usr/bin/env bash
# Starts the NeerNetra backend (:8000) and frontend (:3000). First run trains the model (~1 min).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "$ROOT/backend"
[ -d .venv ] || uv venv --python 3.12 .venv
uv pip install -q --python .venv/bin/python -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8000 &
BACKEND_PID=$!
trap 'kill $BACKEND_PID 2>/dev/null' EXIT

cd "$ROOT/frontend"
[ -d node_modules ] || npm install
npm run dev
