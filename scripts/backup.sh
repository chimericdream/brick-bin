#!/bin/sh
# Nightly backup for the production stack.
# Usage: scripts/backup.sh [backup-dir]     (default ./backups)
# On the Watchtower stack:  COMPOSE="docker compose -f deploy/docker-compose.yml" scripts/backup.sh
#
# What is backed up (docs/PLAN.md section 11):
#   db-<stamp>.sql.gz       Postgres, WITHOUT the contents of the Rebrickable reference tables
#                           (rb_*) or the catalog bookkeeping tables: an import rebuilds them.
#   covers-<stamp>.tar.gz   covers/ (set and wish pictures)
#   instructions/<stamp>/   instruction PDFs, as hard-linked snapshots (only new files take space;
#                           needs rsync and read access to the Docker volume, usually root)
# NOT backed up: catalog/ (about 6 GB of extracted Rebrickable files; re-download it).
# Keeps the newest 14 of each.
set -eu
DIR="${1:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
COMPOSE="${COMPOSE:-docker compose -f docker-compose.prod.yml}"
VOLUME="${DATA_VOLUME:-brick-bin_app-data}"
mkdir -p "$DIR/instructions"

$COMPOSE exec -T db pg_dump -U bricks -d bricks \
  --exclude-table-data 'rb_*' \
  --exclude-table-data 'catalog_runs' \
  --exclude-table-data 'catalog_files' \
  --exclude-table-data 'catalog_part_images' \
  | gzip > "$DIR/db-$STAMP.sql.gz"

$COMPOSE exec -T app tar -C /data -czf - covers 2>/dev/null > "$DIR/covers-$STAMP.tar.gz" || true

SRC="$(docker volume inspect -f '{{ .Mountpoint }}' "$VOLUME" 2>/dev/null || true)/instructions"
if command -v rsync >/dev/null 2>&1 && [ -d "$SRC" ]; then
  PREV="$(ls -1d "$DIR"/instructions/*/ 2>/dev/null | tail -n 1 || true)"
  if [ -n "$PREV" ]; then
    rsync -a --link-dest="$PREV" "$SRC/" "$DIR/instructions/$STAMP/"
  else
    rsync -a "$SRC/" "$DIR/instructions/$STAMP/"
  fi
else
  echo "Skipped instructions: need rsync and read access to the Docker volume $VOLUME (try sudo)." >&2
fi

for prefix in db covers; do
  ls -1t "$DIR"/"$prefix"-* 2>/dev/null | tail -n +15 | while read -r old; do rm -f "$old"; done
done
ls -1d "$DIR"/instructions/*/ 2>/dev/null | head -n -14 | while read -r old; do rm -rf "$old"; done
echo "Backup written to $DIR ($STAMP)"
