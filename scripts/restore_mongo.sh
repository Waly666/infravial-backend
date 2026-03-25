#!/usr/bin/env bash
set -euo pipefail

# Restore de MongoDB en entorno Docker
# - Verifica existencia de backup
# - Valida checksum contra registro (si existe)
# - Crea backup de seguridad previo al restore
# - Restaura con --drop
# - Registra evento en JSONL

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 /ruta/al/backup.archive.gz [actor]"
  exit 1
fi

BACKUP_INPUT="$1"
ACTOR="${2:-manual-admin}"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/infravial}"
REGISTRY_FILE="${REGISTRY_FILE:-$BACKUP_DIR/backup-registry.jsonl}"
MONGO_CONTAINER="${MONGO_CONTAINER:-infravial-mongo}"
MONGO_DB="${MONGO_DB:-infravialDB}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [[ ! -f "$BACKUP_INPUT" ]]; then
  echo "No existe archivo de backup: $BACKUP_INPUT"
  exit 1
fi

if ! docker ps --format '{{.Names}}' | rg -x "$MONGO_CONTAINER" > /dev/null; then
  echo "No se encontro el contenedor Mongo: $MONGO_CONTAINER"
  exit 1
fi

EXPECTED_SHA=""
if [[ -f "$REGISTRY_FILE" ]]; then
  EXPECTED_SHA="$(rg -F "\"file\":\"$BACKUP_INPUT\"" "$REGISTRY_FILE" | rg -o '"sha256":"[a-f0-9]+"' | rg -o '[a-f0-9]+' | tail -n 1 || true)"
fi

ACTUAL_SHA="$(sha256sum "$BACKUP_INPUT" | awk '{print $1}')"
if [[ -n "$EXPECTED_SHA" && "$EXPECTED_SHA" != "$ACTUAL_SHA" ]]; then
  echo "Checksum invalido. Esperado: $EXPECTED_SHA, Actual: $ACTUAL_SHA"
  exit 1
fi

echo "Creando backup preventivo antes del restore..."
ACTOR="pre-restore:$ACTOR" BACKUP_DIR="$BACKUP_DIR" REGISTRY_FILE="$REGISTRY_FILE" MONGO_CONTAINER="$MONGO_CONTAINER" MONGO_DB="$MONGO_DB" \
  "$(dirname "$0")/backup_mongo.sh"

echo "Restaurando desde: $BACKUP_INPUT"
docker exec -i "$MONGO_CONTAINER" sh -c "mongorestore --drop --archive --gzip --nsInclude=\"${MONGO_DB}.*\"" < "$BACKUP_INPUT"

FINISHED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf '{"event":"restore","status":"success","timestamp":"%s","startedAt":"%s","finishedAt":"%s","actor":"%s","db":"%s","container":"%s","file":"%s","sha256":"%s"}\n' \
  "$TIMESTAMP" "$STARTED_AT" "$FINISHED_AT" "$ACTOR" "$MONGO_DB" "$MONGO_CONTAINER" "$BACKUP_INPUT" "$ACTUAL_SHA" \
  >> "$REGISTRY_FILE"

echo "Restore OK"
