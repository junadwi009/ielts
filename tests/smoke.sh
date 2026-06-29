#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] || cp .env.example .env
docker compose up --build -d
# wait for api health (up to 120s)
for i in $(seq 1 60); do
  if curl -fs http://localhost:5050/api/health | grep -q '"ok": *true'; then ok=1; break; fi
  sleep 2
done
if [ "${ok:-}" != "1" ]; then echo "health check failed"; docker compose logs api | tail -50; docker compose down; exit 1; fi
curl -fs http://localhost:5050/api/health | grep -q '"llmMode": *"stub"' && echo "llmMode stub OK"
curl -fs -X POST http://localhost:5050/api/placement/start -H 'Content-Type: application/json' -d '{}' | grep -q '"comboId"' && echo "placement/start OK"
curl -fs http://localhost:5050/api/tips/reading | grep -q 'bullets' && echo "tips OK"
docker compose down
echo "SMOKE OK"
