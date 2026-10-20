#!/bin/sh
set -eu

backup_dir="${BACKUP_DIR:-/opt/arcfolio/backups}"
database_name="${DATABASE_NAME:-arcfolio}"
backup_prefix="${BACKUP_PREFIX:-arcfolio}"
retention_days="${BACKUP_RETENTION_DAYS:-14}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="${backup_dir}/${backup_prefix}-${timestamp}.dump"

mkdir -p "${backup_dir}"

docker exec -e TARGET_DATABASE="${database_name}" postgres sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$TARGET_DATABASE" --format=custom --no-owner --no-acl' \
  > "${backup_file}"

chmod 600 "${backup_file}"
find "${backup_dir}" -type f -name "${backup_prefix}-*.dump" -mtime "+${retention_days}" -delete

echo "Database backup created: ${backup_file}"
