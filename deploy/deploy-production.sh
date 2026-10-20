#!/bin/sh
set -eu

project_dir="${PROJECT_DIR:-/opt/arcfolio}"
compose_file="${project_dir}/compose.production.yml"

cd "${project_dir}"

test -f "${compose_file}"
test -f "${project_dir}/app.env"
test -f "${project_dir}/.env"

docker network inspect arcfolio_backend >/dev/null 2>&1 \
  || docker network create arcfolio_backend >/dev/null

if ! docker inspect postgres --format '{{json .NetworkSettings.Networks}}' | grep -q 'arcfolio_backend'; then
  docker network connect arcfolio_backend postgres
fi

if docker exec postgres sh -c \
  'psql -U "$POSTGRES_USER" -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname = '\''arcfolio'\''"' \
  | grep -q 1; then
  "${project_dir}/backup-database.sh"
fi

docker compose -f "${compose_file}" pull
docker compose -f "${compose_file}" run --rm api npm run prisma:migrate:deploy
docker compose -f "${compose_file}" up -d --remove-orphans

wait_for_healthy() {
  container="$1"
  attempt=0
  while [ "${attempt}" -lt 18 ]; do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container}" 2>/dev/null || true)"
    if [ "${status}" = "healthy" ] || [ "${status}" = "running" ]; then
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 5
  done
  echo "Container ${container} did not become healthy" >&2
  docker compose -f "${compose_file}" ps
  return 1
}

wait_for_healthy arcfolio-api
wait_for_healthy arcfolio-web

docker image prune -f >/dev/null
echo "Deployment healthy: https://arcfolio.ryzko.pl"
