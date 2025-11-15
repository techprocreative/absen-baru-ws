#!/usr/bin/env bash

set -euo pipefail

ENVIRONMENT="${1:-production}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_ROOT="$PROJECT_ROOT/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="$BACKUP_ROOT/${ENVIRONMENT}_${TIMESTAMP}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

cd "$PROJECT_ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  log "DATABASE_URL environment variable is required"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

log "Creating database backup at $BACKUP_DIR/database.sql"
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database.sql"

log "Pulling latest code"
git fetch --all --prune
git checkout main
git pull --ff-only origin main

log "Installing dependencies"
npm ci --omit=dev

log "Running database migrations"
npm run db:migrate

log "Ensuring face models are present"
npm run download-models

log "Building application"
npm run build

log "Running test suite"
npm test

log "Restarting process manager"
if command -v pm2 >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --env "$ENVIRONMENT"
elif command -v systemctl >/dev/null 2>&1 && systemctl list-units --type=service | grep -q "facesenseattend.service"; then
  sudo systemctl restart facesenseattend
else
  log "No supported process manager found. Please restart the service manually."
fi

PORT="${PORT:-5000}"
log "Performing health check on http://localhost:${PORT}/api/health"
set +e
curl -fsS "http://localhost:${PORT}/api/health" >/dev/null
HEALTH_STATUS=$?
set -e

if [[ $HEALTH_STATUS -ne 0 ]]; then
log "Health check failed. Rolling back database..."
  if command -v psql >/dev/null 2>&1; then
    psql "$DATABASE_URL" < "$BACKUP_DIR/database.sql"
  else
    log "psql not available. Restore database manually using $BACKUP_DIR/database.sql"
  fi
  exit 1
fi

log "Deployment completed successfully"
log "Backup stored at: $BACKUP_DIR"
