# SENAM API — Operations Guide

## Contents

1. [Local development](#local-development)
2. [Production deployment](#production-deployment)
3. [Database migrations](#database-migrations)
4. [Backup and restore](#backup-and-restore)
5. [Health checks](#health-checks)
6. [Scheduled jobs](#scheduled-jobs)
7. [Observability](#observability)
8. [Incident runbook](#incident-runbook)

---

## Local development

```bash
# Start supporting services
docker compose -f docker-compose.dev.yml up -d

# Apply migrations
npm run migration:run

# Seed fixtures (idempotent)
npm run seed:dev

# Start the API with hot-reload
npm run start:dev

# Verify
curl http://localhost:3000/healthz        # → { "status": "ok" }
curl http://localhost:3000/readyz         # → { "status": "ok", "checks": { "db": true, "redis": true } }
```

| Service  | URL                          | Purpose                        |
|----------|------------------------------|--------------------------------|
| API      | `http://localhost:3000`      | NestJS application             |
| Swagger  | `http://localhost:3000/swagger` | API docs (non-prod only)   |
| Postgres | `localhost:5432`             | Primary database               |
| Redis    | `localhost:6379`             | Cache, OTP, queues             |
| Minio    | `http://localhost:9001`      | Object store (S3-compat, dev)  |
| Mailhog  | `http://localhost:8025`      | Outbound email sink (dev)      |

---

## Production deployment

```bash
# Build the image
docker build -t senam-api:latest .

# Run with production compose (adjust env vars in .env.prod)
docker compose -f docker-compose.prod.yml up -d

# Or pass env vars directly
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -e JWT_SECRET=... \
  senam-api:latest
```

The Dockerfile is a multi-stage build. The final image is based on `node:20-alpine` (~120 MB) with only the compiled `dist/` output and production `node_modules`.

---

## Database migrations

TypeORM migrations live in `senam_api/migrations/`. They are **not** run automatically on startup; the `synchronize` option is disabled.

```bash
# Apply all pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Generate a new migration (after changing entities)
npm run migration:generate -- --name=describe_your_change
```

**Migration safety checklist** before applying to production:
- [ ] Migration is backwards-compatible (no dropping columns in use)
- [ ] Large-table `ALTER TABLE` statements are split from DML in a separate migration
- [ ] `synchronize: false` is confirmed in `data-source.ts`
- [ ] Migration has been tested on a copy of the production DB

---

## Backup and restore

### Automated backup

Schedule a daily `pg_dump` to S3/R2:

```bash
pg_dump \
  --format=custom \
  --no-password \
  --file="backup-$(date +%Y%m%d).dump" \
  "$DATABASE_URL"

# Upload to R2 / S3
aws s3 cp backup-$(date +%Y%m%d).dump \
  s3://<bucket>/backups/ \
  --storage-class STANDARD_IA
```

Retention policy: keep 7 daily + 4 weekly + 3 monthly backups.

### Restore drill (SC-007)

Run the restore drill script to verify end-to-end recoverability. The target is: dump → restore → integration-test suite passes in **under 1 hour**.

```bash
# Against the local dev DB
./scripts/db-restore-drill.sh

# Against a specific environment
DATABASE_URL="postgres://senam:secret@host:5432/senam" \
  ./scripts/db-restore-drill.sh
```

The script:
1. Dumps the source database using `pg_dump --format=custom`
2. Starts a fresh `postgres:15-alpine` Docker container
3. Restores the dump with `pg_restore`
4. Runs `npm run test:contract` and `npm run test:integration` against the restored DB
5. Reports elapsed time and SLO pass/fail

**Schedule**: run the drill after every major schema migration and at minimum monthly.

---

## Health checks

| Endpoint          | Purpose                      | Expected response                         |
|-------------------|------------------------------|-------------------------------------------|
| `GET /healthz`    | Liveness (process alive)     | `200 { "status": "ok" }`                  |
| `GET /readyz`     | Readiness (DB + Redis reachable) | `200 { "status": "ok", "checks": { "db": true, "redis": true } }` |

Use `/readyz` as the container readiness probe in Kubernetes or ECS task definitions. Use `/healthz` as the liveness probe.

---

## Scheduled jobs

| Job                    | Schedule                 | Description                                |
|------------------------|--------------------------|--------------------------------------------|
| Settlement compute     | Every Sunday 00:30 AST   | Closes the prior week's settlement window  |
| Slot generation        | Nightly at 02:00 AST     | Pre-generates time-slot rows for +7 days   |
| Audit log archival     | Daily at 03:00 UTC       | Exports `audit_logs` rows > 90 days to S3  |
| Dispatch timeout workers | Continuous (BullMQ)    | 5-min accept timers per pending order      |

All cron expressions are in the `.env` file (e.g., `SETTLEMENT_CRON=0 30 0 * * 0`). Override them per-environment without a redeploy.

To manually trigger the settlement job for a specific window:

```bash
# From the API container
curl -X POST http://localhost:3000/v1/admin/settlements/trigger \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"windowStart": "2026-04-27"}'
```

---

## Observability

All logs are emitted as structured JSON (Pino). Sensitive fields (`authorization`, `password`, `card_*`) are redacted automatically.

```bash
# Follow logs (local dev)
npm run start:dev 2>&1 | npx pino-pretty

# Follow logs (production Docker)
docker logs -f senam-api-container | npx pino-pretty
```

The `x-correlation-id` header is generated or propagated on every request and appears in every log line as `correlationId`. Use it to trace a request across log lines.

**Key metrics to monitor** (wire to your APM/alerting):
- `http_request_duration_ms` P95 < 300 ms (SC-002)
- `websocket_delivery_latency_ms` P95 ≤ 2 000 ms (SC-004)
- `dispatch_unassignable_total` — alerts when orders can't be assigned
- `settlement_negative_balance_total` — alerts when carry-forward exceeds `CARRY_FORWARD_ALERT_THRESHOLD`
- Database connection pool saturation

---

## Incident runbook

### Order stuck in `pending` for > 20 minutes

1. Check BullMQ dashboard (Bull Board, if enabled) for stuck jobs in the `dispatch` queue.
2. Check the `audit_logs` table: `SELECT * FROM audit_logs WHERE target_kind='order' AND target_id='<uuid>' ORDER BY at`.
3. Manually reassign: `POST /v1/admin/orders/:id/intervene` with `{ "action": "reassign", "reason": "..." }`.

### OTP emails not arriving

1. Check Mailhog (dev) or SES Send Statistics (prod) for bounce/block events.
2. Verify the `mail` BullMQ queue is not paused: inspect Bull Board.
3. Check env: `MAIL_HOST`, `MAIL_PORT` (dev), or SES credentials (prod).

### Payment webhook not processing

1. Check `POST /v1/payments/webhook/myfatoorah` — ensure it's publicly reachable (no auth required).
2. Verify `MYFATOORAH_WEBHOOK_SECRET` matches the secret configured in the MyFatoorah dashboard.
3. Check `audit_logs` for `payment.webhook_received` events.

### Settlement job produces negative balance

A `net_amount < 0` settlement means the company owes SENAM (e.g., due to refunds exceeding collected commissions). The system:
1. Records the negative balance in `settlements.net_amount`.
2. Rolls it forward as a deduction in the next settlement window.
3. Emits a notification to all `finance_admin` users if the absolute value exceeds `CARRY_FORWARD_ALERT_THRESHOLD`.

Admin action: review the `settlement_lines` for the affected window, reconcile with the payment gateway, and optionally adjust the carry-forward manually.
