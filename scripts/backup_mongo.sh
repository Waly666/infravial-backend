#!/usr/bin/env bash
set -euo pipefail

# Backup de MongoDB en entorno Docker
# - Genera archivo .archive.gz
# - Calcula checksum SHA256
# - Registra evento en JSONL
# - Aplica retencion por dias

BACKUP_DIR="${BACKUP_DIR:-/var/backups/infravial}"
REGISTRY_FILE="${REGISTRY_FILE:-$BACKUP_DIR/backup-registry.jsonl}"
LOCK_FILE="${LOCK_FILE:-$BACKUP_DIR/.backup.lock}"
MONGO_CONTAINER="${MONGO_CONTAINER:-infravial-mongo}"
MONGO_DB="${MONGO_DB:-infravialDB}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
ACTOR="${ACTOR:-system-cron}"

mkdir -p "$BACKUP_DIR"

if [[ -f "$LOCK_FILE" ]]; then
  echo "Backup en curso o lock huerfano: $LOCK_FILE"
  exit 1
fi
trap 'rm -f "$LOCK_FILE"' EXIT
touch "$LOCK_FILE"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE_NAME="infravial_${MONGO_DB}_${TIMESTAMP}.archive.gz"
FILE_PATH="$BACKUP_DIR/$FILE_NAME"
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

if ! docker ps --format '{{.Names}}' | rg -x "$MONGO_CONTAINER" > /dev/null; then
  echo "No se encontro el contenedor Mongo: $MONGO_CONTAINER"
  exit 1
fi

echo "Generando backup: $FILE_PATH"
docker exec "$MONGO_CONTAINER" sh -c "mongodump --db \"$MONGO_DB\" --archive --gzip" > "$FILE_PATH"

if [[ ! -s "$FILE_PATH" ]]; then
  echo "Backup vacio o fallido: $FILE_PATH"
  rm -f "$FILE_PATH"
  exit 1
fi

SHA256="$(sha256sum "$FILE_PATH" | awk '{print $1}')"
SIZE_BYTES="$(wc -c < "$FILE_PATH" | tr -d ' ')"
FINISHED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

printf '{"event":"backup","status":"success","timestamp":"%s","startedAt":"%s","finishedAt":"%s","actor":"%s","db":"%s","container":"%s","file":"%s","sha256":"%s","sizeBytes":%s}\n' \
  "$TIMESTAMP" "$STARTED_AT" "$FINISHED_AT" "$ACTOR" "$MONGO_DB" "$MONGO_CONTAINER" "$FILE_PATH" "$SHA256" "$SIZE_BYTES" \
  >> "$REGISTRY_FILE"

find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.archive.gz' -mtime +"$RETENTION_DAYS" -delete

echo "Backup OK"
echo "Archivo:   $FILE_PATH"
echo "SHA256:    $SHA256"
echo "Tamano:    $SIZE_BYTES bytes"
