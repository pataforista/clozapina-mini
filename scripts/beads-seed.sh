#!/usr/bin/env bash
# Crea en Beads (bd) las tareas de docs/BACKLOG.md.
#   bash scripts/beads-seed.sh          -> solo imprime los comandos (no cambia nada)
#   bash scripts/beads-seed.sh --run    -> los ejecuta (requiere `bd` instalado y `bd init` hecho)
#
# Usa solo la sintaxis documentada en el README de Beads: bd create "Titulo" -p N
# NO PROBADO: `bd` no estaba instalado cuando se escribió. Cada tarea lleva "BL-xx" en el título; la descripción y los
# criterios de aceptación están en docs/BACKLOG.md. Ejecútalo una sola vez para no duplicar tareas.
set -euo pipefail
cd "$(dirname "$0")/.."

RUN=0; [ "${1:-}" = "--run" ] && RUN=1
if [ "$RUN" = 1 ] && ! command -v bd >/dev/null 2>&1; then
  echo "No se encontró 'bd'. Instálalo y ejecuta 'bd init' primero (ver AGENTS.md)." >&2
  exit 1
fi

COUNT=0
while IFS= read -r line; do
  COUNT=$((COUNT + 1))
  echo "$line"
  if [ "$RUN" = 1 ]; then bash -c "$line"; fi
done < <(grep -E '^bd create ' docs/BACKLOG.md)

if [ "$RUN" = 1 ]; then echo "Creadas $COUNT tareas."; else echo "# $COUNT comandos (modo de vista previa). Usa --run para ejecutarlos."; fi
