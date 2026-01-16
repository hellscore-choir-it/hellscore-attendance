#!/usr/bin/env bash
set -euo pipefail

MIGRATIONS_DIR="supabase/migrations"

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "Migrations directory not found: $MIGRATIONS_DIR" >&2
  exit 1
fi

migrations=("$MIGRATIONS_DIR"/*.sql)
if [[ ${#migrations[@]} -eq 0 ]]; then
  echo "No migrations found in $MIGRATIONS_DIR" >&2
  exit 1
fi

apply_with_host_psql() {
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "DATABASE_URL is required when using host psql" >&2
    exit 1
  fi

  echo "Using host psql against DATABASE_URL (CI mode)"

  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "create extension if not exists pgcrypto;"

  while IFS= read -r file; do
    echo "Applying migration: $file"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
  done < <(ls -1 "$MIGRATIONS_DIR"/*.sql | sort)

  # Minimal sanity checks for this branch's schema.
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "select 1 from information_schema.tables where table_schema='public' and table_name='cat_generator_config';"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "select 1 from public.cat_generator_config where id='00000000-0000-0000-0000-000000000000';"

  echo "OK: migrations applied cleanly"
}

apply_with_docker_psql_client() {
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "DATABASE_URL is required when using dockerized psql" >&2
    exit 1
  fi

  if ! command -v docker >/dev/null 2>&1; then
    echo "docker not found; install Docker Desktop" >&2
    exit 1
  fi

  # If DATABASE_URL points to a DB published on the host (e.g. localhost:5432),
  # a container can't reach it via localhost. On Mac/Windows, host.docker.internal
  # is the conventional hostname; for Linux, we add a host-gateway mapping.
  local docker_database_url="$DATABASE_URL"
  docker_database_url="${docker_database_url//localhost/host.docker.internal}"
  docker_database_url="${docker_database_url//127.0.0.1/host.docker.internal}"
  docker_database_url="${docker_database_url//\[::1\]/host.docker.internal}"

  echo "Using dockerized psql against DATABASE_URL (local Docker/CI-like mode)"

  docker run --rm -i \
    --add-host=host.docker.internal:host-gateway \
    postgres:16 \
    psql "$docker_database_url" -v ON_ERROR_STOP=1 -c "create extension if not exists pgcrypto;" \
    >/dev/null

  while IFS= read -r file; do
    echo "Applying migration: $file"
    docker run --rm -i \
      --add-host=host.docker.internal:host-gateway \
      postgres:16 \
      psql "$docker_database_url" -v ON_ERROR_STOP=1 \
      < "$file" \
      >/dev/null
  done < <(ls -1 "$MIGRATIONS_DIR"/*.sql | sort)

  docker run --rm -i \
    --add-host=host.docker.internal:host-gateway \
    postgres:16 \
    psql "$docker_database_url" -v ON_ERROR_STOP=1 -c "select 1 from information_schema.tables where table_schema='public' and table_name='cat_generator_config';" \
    >/dev/null

  docker run --rm -i \
    --add-host=host.docker.internal:host-gateway \
    postgres:16 \
    psql "$docker_database_url" -v ON_ERROR_STOP=1 -c "select 1 from public.cat_generator_config where id='00000000-0000-0000-0000-000000000000';" \
    >/dev/null

  echo "OK: migrations applied cleanly"
}

apply_with_docker_postgres() {
  local container="hellscore-migrations-check"
  local image="postgres:16"
  local publish_port="${MIGRATIONS_DOCKER_PUBLISH_PORT:-0}"
  local host_port="${MIGRATIONS_DOCKER_PORT:-54329}"

  if ! command -v docker >/dev/null 2>&1; then
    echo "docker not found; install Docker Desktop (or set DATABASE_URL + install psql)" >&2
    exit 1
  fi

  if docker ps -a --format '{{.Names}}' | grep -qx "$container"; then
    echo "Found existing container named $container; stopping/removing" >&2
    docker rm -f "$container" >/dev/null
  fi

  echo "Starting ephemeral Postgres container ($image) for migration check"
  if [[ "$publish_port" == "1" ]]; then
    echo "Publishing container port to localhost:$host_port (MIGRATIONS_DOCKER_PUBLISH_PORT=1)"
    docker run -d --rm \
      --name "$container" \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_DB=postgres \
      -p "$host_port":5432 \
      "$image" >/dev/null
  else
    docker run -d --rm \
    --name "$container" \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_DB=postgres \
    "$image" >/dev/null
  fi

  cleanup() {
    docker rm -f "$container" >/dev/null 2>&1 || true
  }
  trap cleanup EXIT

  echo "Waiting for Postgres to be ready..."
  for _ in $(seq 1 30); do
    if docker exec "$container" pg_isready -U postgres -d postgres >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  if ! docker exec "$container" pg_isready -U postgres -d postgres >/dev/null 2>&1; then
    echo "Postgres did not become ready in time" >&2
    exit 1
  fi

  echo "Applying migrations inside container"
  docker exec -i "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "create extension if not exists pgcrypto;" >/dev/null

  while IFS= read -r file; do
    echo "Applying migration: $file"
    cat "$file" | docker exec -i "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 >/dev/null
  done < <(ls -1 "$MIGRATIONS_DIR"/*.sql | sort)

  docker exec -i "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "select 1 from information_schema.tables where table_schema='public' and table_name='cat_generator_config';" >/dev/null
  docker exec -i "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "select 1 from public.cat_generator_config where id='00000000-0000-0000-0000-000000000000';" >/dev/null

  echo "OK: migrations applied cleanly"
}

if [[ -n "${DATABASE_URL:-}" ]]; then
  if command -v psql >/dev/null 2>&1; then
    apply_with_host_psql
  else
    apply_with_docker_psql_client
  fi
else
  apply_with_docker_postgres
fi
