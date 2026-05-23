# SENAM API

NestJS 10 backend for the SENAM car-wash booking platform — MVP (Doha, Qatar).

See the full specification and design docs in [`specs/001-senam-backend-api/`](../specs/001-senam-backend-api/).

---

## Prerequisites

| Tool             | Minimum version | Notes                                |
|------------------|-----------------|--------------------------------------|
| Node.js          | 20 LTS          | `node --version`                     |
| npm              | 9+              | bundled with Node 20                 |
| Docker           | 24+             | for local services                   |
| Docker Compose   | v2              | `docker compose version`             |
| k6               | 0.50+           | optional — for load tests only       |

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy and edit environment config
cp .env.example .env

# 3. Start Postgres, Redis, Minio, Mailhog
docker compose -f docker-compose.dev.yml up -d

# 4. Apply database migrations
npm run migration:run

# 5. Seed development fixtures (idempotent)
npm run seed:dev

# 6. Start the API with hot-reload
npm run start:dev
```

Verify:

```bash
curl http://localhost:3000/healthz    # → { "status": "ok" }
curl http://localhost:3000/readyz     # → { "status": "ok", "checks": { "db": true, "redis": true } }
```

Swagger UI: `http://localhost:3000/swagger` (non-production only)

---

## Key URLs (local dev)

| Service   | URL                          | Credentials            |
|-----------|------------------------------|------------------------|
| API       | `http://localhost:3000`      | —                      |
| Swagger   | `http://localhost:3000/swagger` | —                   |
| Postgres  | `localhost:5432`             | senam / senam          |
| Redis     | `localhost:6379`             | —                      |
| Minio     | `http://localhost:9001`      | senam / senam_secret   |
| Mailhog   | `http://localhost:8025`      | — (all outgoing email) |

---

## Seeded test fixtures

Run `npm run seed:dev` to populate:

| Fixture          | Value                          |
|------------------|-------------------------------|
| Super admin      | `superadmin@senam.qa`          |
| Ops admin        | `opsadmin@senam.qa`            |
| Active company   | slug `nadhif` (نظيف)           |
| Provider owner   | `owner@nadhif.qa`              |
| Customers        | `customer1@test.com` … `customer5@test.com` (5 accounts) |
| Active coupon    | code `WELCOME10` (10% off, 30-day validity) |
| Categories       | `car-wash`, `detailing`        |

OTP codes are emailed to **Mailhog** (`http://localhost:8025`) in development.

---

## Available scripts

```bash
npm run start         # start (no watch)
npm run start:dev     # start with hot-reload
npm run start:prod    # start compiled dist/

npm run build         # compile TypeScript → dist/

npm run migration:run     # apply pending TypeORM migrations
npm run migration:revert  # revert the last migration
npm run migration:generate -- --name=<name>  # generate from entity changes

npm run seed:dev      # idempotent fixture seed

npm run test              # all Jest tests
npm run test:unit         # unit tests (src/)
npm run test:contract     # contract tests (test/contract/)
npm run test:integration  # integration tests with Testcontainers (test/integration/)
npm run test:openapi      # congruence test — requires a running server

npm run lint          # ESLint + Prettier check
npm run format        # auto-fix formatting
```

---

## Environment variables

See `.env.example` for the full list with documentation. Required variables:

| Variable                    | Description                                  |
|-----------------------------|----------------------------------------------|
| `DATABASE_URL`              | PostgreSQL connection URL                    |
| `REDIS_URL`                 | Redis connection URL                         |
| `JWT_SECRET`                | HS256 signing secret — min 64 chars          |
| `MYFATOORAH_API_KEY`        | Payment gateway API key                      |
| `MYFATOORAH_WEBHOOK_SECRET` | HMAC secret for webhook verification         |
| `AWS_SES_ACCESS_KEY_ID`     | SES credentials for transactional email      |
| `AWS_SES_SECRET_ACCESS_KEY` | SES credentials for transactional email      |
| `S3_ACCESS_KEY_ID`          | R2/S3 credentials for object storage         |
| `S3_SECRET_ACCESS_KEY`      | R2/S3 credentials for object storage         |

---

## Production deployment

```bash
# Build image
docker build -t senam-api:latest .

# Reference deploy (single host with embedded Postgres + Redis)
cp .env.example .env.prod   # fill in real credentials
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

See [`docs/operations.md`](./docs/operations.md) for the full operations guide: migrations, backup/restore drills, health checks, scheduled jobs, and incident runbooks.

See [`docs/security-review.md`](./docs/security-review.md) for the OWASP API Top 10 review and security recommendations.

---

## Architecture overview

The API is a **modular monolith** (one deployable, isolated feature modules in `src/modules/`). Each module owns its entities, services, controllers, and a contract-test file. Any module can be extracted into a microservice later without rewriting business logic.

```
src/
├── config/           # Typed env-validated config
├── common/           # Guards, filters, interceptors, i18n
├── infrastructure/   # Adapters (DB, Redis, Queue, Mail, Payments, Storage, Realtime)
└── modules/          # Feature modules — auth, users, bookings, payments, …
migrations/           # TypeORM numbered migrations
test/
├── contract/         # Supertest specs — one per feature module
├── integration/      # Testcontainers — slot race, dispatch, settlements
└── load/             # k6 load scripts (SC-002, SC-004)
```

Key design decisions (from [`specs/001-senam-backend-api/plan.md`](../specs/001-senam-backend-api/plan.md)):
- **TypeORM** over Prisma for explicit `QueryRunner` control (slot-decrement + payment + coupon in one transaction).
- **BullMQ** delayed jobs for the 5-minute dispatch accept timer (not `pg_cron`).
- **PostGIS** `geography(Point)` for nearest-company queries + service-area polygon checks.
- **Redis** pub/sub for Socket.io fan-out across API replicas (SC-004 ≤ 2 s delivery).
