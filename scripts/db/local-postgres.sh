#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${LOCAL_DB_CONTAINER_NAME:-hellscore-local-postgres}"
IMAGE="${LOCAL_DB_IMAGE:-postgres:16}"
HOST_PORT="${LOCAL_DB_PORT:-54329}"
DB_NAME="${LOCAL_DB_NAME:-postgres}"
DB_USER="${LOCAL_DB_USER:-postgres}"
DB_PASSWORD="${LOCAL_DB_PASSWORD:-postgres}"

usage() {
  cat <<EOF
Usage: $0 <command>

Commands:
  up       Start (or reuse) a local Postgres container on localhost:${HOST_PORT}
  down     Stop/remove the local Postgres container
  status   Show container status
  url      Print DATABASE_URL for connecting from the host

Env overrides:
  LOCAL_DB_CONTAINER_NAME, LOCAL_DB_IMAGE, LOCAL_DB_PORT,
  LOCAL_DB_NAME, LOCAL_DB_USER, LOCAL_DB_PASSWORD
EOF
}

cmd="${1:-}"
if [[ -z "$cmd" ]]; then
  usage
  exit 1
fi

case "$cmd" in
  up)
    if ! command -v docker >/dev/null 2>&1; then
      echo "docker not found; install Docker Desktop" >&2
      exit 1
    fi

    if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
      echo "Postgres already running: $CONTAINER_NAME"
      "$0" url
      exit 0
    fi

    if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
      echo "Found existing container named $CONTAINER_NAME; starting it"
      docker start "$CONTAINER_NAME" >/dev/null
    else
      echo "Starting local Postgres container ($IMAGE) as $CONTAINER_NAME"
      docker run -d \
        --name "$CONTAINER_NAME" \
        -e POSTGRES_PASSWORD="$DB_PASSWORD" \
        -e POSTGRES_USER="$DB_USER" \
        -e POSTGRES_DB="$DB_NAME" \
        -p "$HOST_PORT":5432 \
        "$IMAGE" >/dev/null
    fi

    echo "Waiting for Postgres to be ready..."
    for _ in $(seq 1 30); do
      if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        break
      fi
      sleep 1
    done

    if ! docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
      echo "Postgres did not become ready in time" >&2
      exit 1
    fi

    echo "OK: Postgres ready"
    "$0" url
    ;;

  down)
    if ! command -v docker >/dev/null 2>&1; then
      echo "docker not found; install Docker Desktop" >&2
      exit 1
    fi

    if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
      docker rm -f "$CONTAINER_NAME" >/dev/null
      echo "Removed container: $CONTAINER_NAME"
    else
      echo "No container found: $CONTAINER_NAME"
    fi
    ;;

  status)
    if ! command -v docker >/dev/null 2>&1; then
      echo "docker not found; install Docker Desktop" >&2
      exit 1
    fi

    docker ps -a --filter "name=^/${CONTAINER_NAME}$" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    ;;

  url)
    echo "export DATABASE_URL='postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${HOST_PORT}/${DB_NAME}'"
    ;;

  *)
    usage
    exit 1
    ;;
esac
