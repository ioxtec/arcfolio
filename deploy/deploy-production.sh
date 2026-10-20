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

attempt=0
until wget -qO- https://arcfolio.ryzko.pl/api/health | grep -q '"status":"ok"'; do
  attempt=$((attempt + 1))
  if [ "${attempt}" -ge 12 ]; then
    echo "Deployment health check failed" >&2
    docker compose -f "${compose_file}" ps
    exit 1
  fi
  sleep 5
done

docker image prune -f >/dev/null
echo "Deployment healthy: https://arcfolio.ryzko.pl"
