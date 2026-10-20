#!/bin/sh
set -eu

backup_dir="${BACKUP_DIR:-/opt/arcfolio/backups}"
retention_days="${BACKUP_RETENTION_DAYS:-14}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="${backup_dir}/arcfolio-${timestamp}.dump"

mkdir -p "${backup_dir}"

docker exec postgres sh -c \
  'pg_dump -U "$POSTGRES_USER" -d arcfolio --format=custom --no-owner --no-acl' \
  > "${backup_file}"

chmod 600 "${backup_file}"
find "${backup_dir}" -type f -name 'arcfolio-*.dump' -mtime "+${retention_days}" -delete

echo "Database backup created: ${backup_file}"
