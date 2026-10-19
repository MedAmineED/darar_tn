#!/usr/bin/env bash
# Dump the database and archive uploads to $BACKUP_DIR, keeping $KEEP_DAYS days.
# Restore DB:  gunzip -c db-XXX.sql.gz | docker compose exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD"'
set -euo pipefail
cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/darar}"
KEEP_DAYS="${KEEP_DAYS:-14}"
TS="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR" && chmod 700 "$BACKUP_DIR"

if docker compose ps --status running --services | grep -qx mysql; then
  docker compose exec -T mysql sh -c \
    'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --databases "$MYSQL_DATABASE"' \
    2>/dev/null | gzip > "$BACKUP_DIR/db-$TS.sql.gz"
  docker compose exec -T backend tar czf - -C /app/uploads . > "$BACKUP_DIR/uploads-$TS.tgz" 2>/dev/null || true
  chmod 600 "$BACKUP_DIR"/*-"$TS".*
  echo "backup: $BACKUP_DIR/*-$TS.*"
else
  echo "backup: mysql not running, skipped"
fi

find "$BACKUP_DIR" -type f -mtime +"$KEEP_DAYS" -delete
