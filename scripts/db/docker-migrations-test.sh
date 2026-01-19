#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  bash scripts/db/local-postgres.sh down >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Starting local Docker Postgres (CI-like)..."
bash scripts/db/local-postgres.sh up

# shellcheck disable=SC1090
eval "$(bash scripts/db/local-postgres.sh url)"

bash scripts/db/check-migrations.sh

echo "OK: docker-based migrations test passed"