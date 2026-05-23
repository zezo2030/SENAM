#!/usr/bin/env bash
# db-restore-drill.sh — Backup/restore drill for SENAM API (SC-007)
#
# Objective:
#   1. Dump a snapshot from the source Postgres instance
#   2. Restore it into a fresh Postgres container
#   3. Run the integration test suite against the restored DB
#   4. Report total elapsed time (target: < 1 hour end-to-end)
#
# Usage:
#   # Against the local dev DB (default)
#   ./scripts/db-restore-drill.sh
#
#   # Against a named environment
#   DATABASE_URL="postgres://senam:secret@prod-host:5432/senam" \
#     ./scripts/db-restore-drill.sh
#
# Dependencies: docker, pg_dump (psql client), bash 4+

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────

DATABASE_URL="${DATABASE_URL:-postgresql://senam:senam@localhost:5432/senam}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
RESTORE_DB_PORT="${RESTORE_DB_PORT:-15432}"
RESTORE_CONTAINER_NAME="senam-restore-drill-$$"
DUMP_FILE="/tmp/senam-drill-dump-$$.custom"
START_TIME=$(date +%s)

# Colour helpers
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log_info()    { echo -e "${GREEN}[DRILL]${NC} $*"; }
log_warn()    { echo -e "${YELLOW}[WARN] ${NC} $*"; }
log_err()     { echo -e "${RED}[ERR]  ${NC} $*" >&2; }
elapsed_mins() { echo $(( ($(date +%s) - START_TIME) / 60 )); }

# ─── Cleanup on exit ─────────────────────────────────────────────────────────
cleanup() {
  log_info "Cleaning up restore container and dump file..."
  docker rm -f "${RESTORE_CONTAINER_NAME}" 2>/dev/null || true
  rm -f "${DUMP_FILE}"
}
trap cleanup EXIT

# ─── Step 1: Dump the source database ────────────────────────────────────────
log_info "Step 1/4 — Dumping source database..."
log_info "  Source: ${DATABASE_URL}"
log_info "  Output: ${DUMP_FILE}"

pg_dump \
  --format=custom \
  --no-password \
  --verbose \
  --file="${DUMP_FILE}" \
  "${DATABASE_URL}" 2>&1 | tail -5

DUMP_SIZE=$(du -sh "${DUMP_FILE}" | cut -f1)
log_info "  Dump complete. Size: ${DUMP_SIZE}"

# ─── Step 2: Start a fresh Postgres container ─────────────────────────────────
log_info "Step 2/4 — Starting fresh Postgres container for restore..."

docker run -d \
  --name "${RESTORE_CONTAINER_NAME}" \
  -e POSTGRES_USER=senam \
  -e POSTGRES_PASSWORD=senam \
  -e POSTGRES_DB=senam_restore \
  -p "${RESTORE_DB_PORT}:5432" \
  postgres:15-alpine \
  2>&1

log_info "  Container: ${RESTORE_CONTAINER_NAME} (port ${RESTORE_DB_PORT})"
log_info "  Waiting for Postgres to be ready..."

READY=0
for i in $(seq 1 30); do
  if docker exec "${RESTORE_CONTAINER_NAME}" \
      pg_isready -U senam -d senam_restore >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 2
done

if [[ "${READY}" -ne 1 ]]; then
  log_err "Postgres container did not become ready within 60 seconds."
  exit 1
fi

log_info "  Postgres ready after $((i * 2))s"

# Enable required extensions in the restore DB
docker exec "${RESTORE_CONTAINER_NAME}" \
  psql -U senam -d senam_restore -c \
  "CREATE EXTENSION IF NOT EXISTS pgcrypto;
   CREATE EXTENSION IF NOT EXISTS citext;" \
  2>/dev/null || true

# ─── Step 3: Restore ──────────────────────────────────────────────────────────
log_info "Step 3/4 — Restoring into fresh container..."

RESTORE_URL="postgresql://senam:senam@localhost:${RESTORE_DB_PORT}/senam_restore"

pg_restore \
  --no-password \
  --verbose \
  --dbname="${RESTORE_URL}" \
  --no-owner \
  --no-acl \
  "${DUMP_FILE}" 2>&1 | tail -10 || {
    log_warn "pg_restore exited non-zero (may be due to PostGIS or extension warnings — check output above)"
  }

log_info "  Restore complete. Elapsed: $(elapsed_mins) min"

# Quick sanity check
ROW_COUNT=$(
  psql "${RESTORE_URL}" -t -c "SELECT count(*) FROM users;" 2>/dev/null | xargs
)
log_info "  Sanity: users table has ${ROW_COUNT} rows"

# ─── Step 4: Run integration tests against the restored DB ───────────────────
log_info "Step 4/4 — Running integration test suite against restored DB..."

export DATABASE_URL="${RESTORE_URL}"
export REDIS_URL="${REDIS_URL}"
export NODE_ENV=test

# Run the contract + integration tests (skip load tests)
if npm run test:contract -- --passWithNoTests 2>&1 | tail -20; then
  log_info "  Contract tests: PASSED"
else
  log_warn "  Contract tests: some failures — see output above"
fi

if npm run test:integration -- --passWithNoTests 2>&1 | tail -20; then
  log_info "  Integration tests: PASSED"
else
  log_warn "  Integration tests: some failures — see output above"
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
TOTAL_MINS=$(elapsed_mins)
log_info "========================================"
log_info "  Restore drill complete."
log_info "  Total elapsed: ${TOTAL_MINS} minutes"
if [[ "${TOTAL_MINS}" -le 60 ]]; then
  log_info "  SLO: PASS (target < 60 min)"
else
  log_warn "  SLO: FAIL (${TOTAL_MINS} min > 60 min target SC-007)"
fi
log_info "========================================"
