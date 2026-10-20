#!/bin/sh
set -eu

app_dir="${PROJECT_DIR:-/opt/arcfolio-dev}"
backup_dir="/opt/backups/arcfolio-dev-bootstrap/$(date -u +%Y%m%dT%H%M%SZ)"
postgres_dir="/opt/postgres"

umask 077
mkdir -p "${backup_dir}" "${app_dir}/backups"

cp "${postgres_dir}/docker-compose.yml" "${backup_dir}/postgres-compose.yml"
docker exec postgres sh -c 'pg_dumpall -U "$POSTGRES_USER" --clean --if-exists' \
  | gzip > "${backup_dir}/postgres-all.sql.gz"

docker network inspect arcfolio_dev_backend >/dev/null 2>&1 \
  || docker network create arcfolio_dev_backend >/dev/null
docker network inspect caddy_default >/dev/null 2>&1 \
  || docker network create caddy_default >/dev/null

if ! docker inspect postgres --format '{{json .NetworkSettings.Networks}}' | grep -q 'arcfolio_dev_backend'; then
  docker network connect arcfolio_dev_backend postgres
fi

if [ ! -f "${app_dir}/app.env" ]; then
  database_password="$(openssl rand -hex 24)"
  jwt_secret="$(openssl rand -hex 48)"

  docker exec -e ARCFOLIO_DEV_DB_PASSWORD="${database_password}" postgres sh -c '
    psql -v ON_ERROR_STOP=1 -v app_password="$ARCFOLIO_DEV_DB_PASSWORD" -U "$POSTGRES_USER" -d postgres <<SQL
SELECT '\''CREATE ROLE arcfolio_dev LOGIN'\'' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '\''arcfolio_dev'\'')\gexec
ALTER ROLE arcfolio_dev WITH LOGIN PASSWORD :'\''app_password'\'';
SELECT '\''CREATE DATABASE arcfolio_dev OWNER arcfolio_dev'\'' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '\''arcfolio_dev'\'')\gexec
SQL
  '

  {
    printf 'DATABASE_URL="postgresql://arcfolio_dev:%s@postgres:5432/arcfolio_dev?schema=public"\n' "${database_password}"
    printf 'PORT=3000\n'
    printf 'NODE_ENV=production\n'
    printf 'WEB_ORIGIN="https://dev.arcfolio.ryzko.pl"\n'
    printf 'API_PUBLIC_URL="https://dev.arcfolio.ryzko.pl/api"\n'
    printf 'AUTH_JWT_SECRET="%s"\n' "${jwt_secret}"
    printf 'GOOGLE_CLIENT_ID=""\n'
    printf 'GOOGLE_CLIENT_SECRET=""\n'
  } > "${app_dir}/app.env"
  chmod 600 "${app_dir}/app.env"
fi

if [ ! -f "${app_dir}/.env" ]; then
  {
    printf 'API_IMAGE=arcfolio-dev-api\n'
    printf 'WEB_IMAGE=arcfolio-dev-web\n'
    printf 'IMAGE_TAG=local\n'
  } > "${app_dir}/.env"
  chmod 600 "${app_dir}/.env"
fi

if id arcfolio-deploy >/dev/null 2>&1; then
  chown -R arcfolio-deploy:arcfolio-deploy "${app_dir}"
fi

echo "Development environment prepared. Backup: ${backup_dir}"
