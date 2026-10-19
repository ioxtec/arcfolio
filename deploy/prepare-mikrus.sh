#!/bin/sh
set -eu

app_dir="${PROJECT_DIR:-/opt/arcfolio}"
backup_dir="/opt/backups/arcfolio-bootstrap/$(date -u +%Y%m%dT%H%M%SZ)"
postgres_dir="/opt/postgres"
caddy_file="/opt/caddy/Caddyfile"

umask 077
mkdir -p "${backup_dir}" "${app_dir}/backups"

cp "${postgres_dir}/docker-compose.yml" "${backup_dir}/postgres-compose.yml"
cp "${caddy_file}" "${backup_dir}/Caddyfile"
docker exec postgres sh -c 'pg_dumpall -U "$POSTGRES_USER" --clean --if-exists' \
  | gzip > "${backup_dir}/postgres-all.sql.gz"

if grep -q '5432:5432' "${postgres_dir}/docker-compose.yml"; then
  sed -i '/^[[:space:]]*ports:[[:space:]]*$/,+1d' "${postgres_dir}/docker-compose.yml"
  (
    cd "${postgres_dir}"
    docker compose up -d --force-recreate
  )
fi

docker network inspect arcfolio_backend >/dev/null 2>&1 \
  || docker network create arcfolio_backend >/dev/null

if ! docker inspect postgres --format '{{json .NetworkSettings.Networks}}' | grep -q 'arcfolio_backend'; then
  docker network connect arcfolio_backend postgres
fi

if [ ! -f "${app_dir}/app.env" ]; then
  database_password="$(openssl rand -hex 24)"
  jwt_secret="$(openssl rand -hex 48)"

  docker exec -e ARCFOLIO_DB_PASSWORD="${database_password}" postgres sh -c '
    psql -v ON_ERROR_STOP=1 -v app_password="$ARCFOLIO_DB_PASSWORD" -U "$POSTGRES_USER" -d postgres <<SQL
SELECT '\''CREATE ROLE arcfolio LOGIN'\'' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '\''arcfolio'\'')\gexec
ALTER ROLE arcfolio WITH LOGIN PASSWORD :'\''app_password'\'';
SELECT '\''CREATE DATABASE arcfolio OWNER arcfolio'\'' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '\''arcfolio'\'')\gexec
SQL
  '

  {
    printf 'DATABASE_URL="postgresql://arcfolio:%s@postgres:5432/arcfolio?schema=public"\n' "${database_password}"
    printf 'PORT=3000\n'
    printf 'NODE_ENV=production\n'
    printf 'WEB_ORIGIN="https://arcfolio.ryzko.pl"\n'
    printf 'API_PUBLIC_URL="https://arcfolio.ryzko.pl/api"\n'
    printf 'AUTH_JWT_SECRET="%s"\n' "${jwt_secret}"
    printf 'GOOGLE_CLIENT_ID=""\n'
    printf 'GOOGLE_CLIENT_SECRET=""\n'
  } > "${app_dir}/app.env"
  chmod 600 "${app_dir}/app.env"
fi

if [ ! -f "${app_dir}/.env" ]; then
  {
    printf 'API_IMAGE=arcfolio-api\n'
    printf 'WEB_IMAGE=arcfolio-web\n'
    printf 'IMAGE_TAG=local\n'
  } > "${app_dir}/.env"
  chmod 600 "${app_dir}/.env"
fi

if ! grep -q '^arcfolio\.ryzko\.pl {' "${caddy_file}"; then
  {
    printf '\narcfolio.ryzko.pl {\n'
    printf '    reverse_proxy arcfolio-web:80\n'
    printf '}\n'
  } >> "${caddy_file}"
fi

if ! docker exec caddy caddy validate --config /etc/caddy/Caddyfile; then
  cp "${backup_dir}/Caddyfile" "${caddy_file}"
  echo "Caddy validation failed; configuration restored" >&2
  exit 1
fi

docker exec caddy caddy reload --config /etc/caddy/Caddyfile

echo "Mikrus prepared. Backup: ${backup_dir}"
