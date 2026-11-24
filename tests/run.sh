#!/usr/bin/env bash
# Levanta un servidor estático local y ejecuta las pruebas de punta a punta.
#   bash tests/run.sh            -> prueba de humo (con aserciones, código de salida 0/1)
#   bash tests/run.sh --report   -> además, auditorías de dispositivos y accesibilidad (informes)
# Requisitos: python3, node y Playwright disponible para require('playwright').
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8123}"
export BASE_URL="http://127.0.0.1:${PORT}"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
export OUT="${OUT:-${TMPDIR:-/tmp}/clz-e2e}"

python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
sleep 1

node tests/e2e/smoke.js
if [ "${1:-}" = "--report" ]; then
  node tests/e2e/devices-audit.js
  node tests/e2e/a11y-report.js
  echo "Informes y capturas en: $OUT"
fi
