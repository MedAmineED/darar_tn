#!/usr/bin/env bash
# Pull latest code and rebuild/restart the stack. Data volumes are untouched.
#   ./deploy/deploy.sh            # pull + build + up
#   ./deploy/deploy.sh --no-pull  # rebuild local code only
set -euo pipefail
cd "$(dirname "$0")/.."

[[ -f .env ]] || { echo ".env missing" >&2; exit 1; }

# Safety net before any schema migration runs.
./deploy/backup.sh

[[ "${1:-}" == "--no-pull" ]] || git pull --ff-only

docker compose build
docker compose up -d --remove-orphans
docker image prune -f >/dev/null
docker compose ps
