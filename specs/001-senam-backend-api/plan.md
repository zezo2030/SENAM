# Implementation Plan: SENAM Backend API Platform

**Branch**: `001-senam-backend-api` | **Date**: 2026-05-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-senam-backend-api/spec.md`

## Summary

Build a single NestJS backend service ("SENAM API") that exposes the full surface the SENAM platform needs: customer mobile app (Flutter), provider web dashboard, and admin web dashboard. The service is structured as a **modular monolith** (one deployable, many independent feature modules) so the MVP can ship fast on Doha + car-wash and individual modules can be lifted into separate services later without rewrites — matching the architecture doc in `screenshot/SENAM_Architecture.html`. PostgreSQL 15 is the system of record; Redis is used for OTP storage, rate-limiting, cache, and pub/sub for real-time order updates; an external transactional-email provider delivers OTP codes (no SMS); an external Qatar-supported payment gateway tokenises and authorises card payments; an external object store holds images and KYC documents. All public endpoints are described in OpenAPI/Swagger generated from NestJS decorators at runtime, with Swagger UI exposed in non-production environments.

## Technical Context

**Language/Version**: TypeScript 5.4+ on Node.js 20 LTS
**Primary Dependencies**: NestJS 10 (`@nestjs/swagger`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/throttler`, `@nestjs/schedule`, `@nestjs/websockets` + `@nestjs/platform-socket.io`, `@nestjs/bull`), TypeORM 0.3 (chosen over Prisma for first-class transaction + `QueryRunner` control around the slot-decrement race), `pg` driver, `class-validator` + `class-transformer`, `bcrypt` (OTP hash), `ioredis`, BullMQ (job queue on Redis).
**Storage**: PostgreSQL 15 (primary, with `pgcrypto` for UUIDs and PostGIS for geo); Redis 7 (OTP store, rate-limiter, cache, pub/sub, BullMQ); S3-compatible object store (presigned uploads for gallery, KYC, review photos — no binary blobs in Postgres).
**Testing**: Jest (unit + integration), Supertest (HTTP contract tests against an in-memory Nest app), Testcontainers-node (real Postgres + Redis per integration suite), and a CI assertion that the live OpenAPI doc and `contracts/openapi.yaml` stay congruent (FR-029, SC-006).
**Target Platform**: Linux x86_64 server (containerised). MVP deployment is single-region; horizontal scaling via stateless API replicas behind a load balancer, with Redis pub/sub fan-out for WebSocket events.
**Project Type**: Web service (backend API + WebSocket gateway). No frontend code in this repository.
**Performance Goals**: P95 < 300 ms / P99 < 800 ms on customer-facing listing, catalog, and booking endpoints under sustained 10k concurrent users (SC-002); real-time order-status delivery P95 ≤ 2 s end-to-end (SC-004); admin sales-report queries up to 12 months in ≤ 5 s (SC-008).
**Constraints**:
- Monetary values stored as integer minor units in QAR (`int8` cents) — no float currency.
- All timestamps stored in UTC `timestamptz`; business-day boundaries (weekly settlement Sunday cut-over) evaluated in `Asia/Qatar`.
- Arabic text round-trips losslessly (UTF-8 everywhere, `citext` for email).
- No card data ever lands on SENAM infrastructure — gateway tokenisation only.
- Zero double-booking / duplicate-charge / coupon over-redemption under 100× concurrent contention (SC-005) — design must use DB-level guards, not just application locks.
**Scale/Scope**: MVP target — 10k registered users, 50 onboarded companies in Doha car-wash, 5k bookings/month (PRD §2.1). Schema designed to absorb additional categories and cities without breaking changes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The repo's `.specify/memory/constitution.md` is the unmodified template (placeholder principles `[PRINCIPLE_1_NAME] … [PRINCIPLE_5_NAME]`). **No ratified principles exist yet**, so there is no enforceable gate to check against. This plan therefore:

- Treats the gate as **informational**, not blocking.
- Voluntarily commits to a small principle set appropriate for an API service: (a) every module is independently testable; (b) every public endpoint has a matching contract test; (c) no implicit currency, time-zone, or locale conversions; (d) no raw card data; (e) every privileged admin write is audited.
- Recommends that the user run `/speckit.constitution` to ratify a real constitution before `/speckit.implement` so future audits have something to bind to. Recorded under **Complexity Tracking** as "constitution debt", not a violation.

**Gate result**: PASS (informational only — no ratified principles to violate).

## Project Structure

### Documentation (this feature)

```text
specs/001-senam-backend-api/
├── plan.md              # This file
├── spec.md              # Feature spec (with 5-question Clarifications)
├── research.md          # Phase 0 — resolves remaining tech-choice unknowns
├── data-model.md        # Phase 1 — Postgres schema, indexes, constraints
├── quickstart.md        # Phase 1 — bootstrap, run, and smoke-test the API
├── contracts/
│   └── openapi.yaml     # Phase 1 — endpoint surface sketch (Swagger source of truth is the running app)
└── checklists/
    └── requirements.md  # Spec-quality checklist (already created)
```

### Source Code (repository root)

The Flutter app lives in `senam_app/` (out of scope here). The backend gets its own sibling directory `senam_api/`. Sibling roots — instead of a monorepo wrapper — match what already exists in this workspace and avoid reshuffling the Flutter project.

```text
senam_api/
├── src/
│   ├── main.ts                        # NestJS bootstrap (Swagger UI mounted in non-prod)
│   ├── app.module.ts                  # Composes feature modules
│   ├── config/                        # Typed config (env loader, validation via class-validator)
│   ├── common/
│   │   ├── decorators/                # @CurrentUser, @Roles, @AuditAction
│   │   ├── guards/                    # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/              # ResponseLogger, CorrelationId, TransformInterceptor
│   │   ├── filters/                   # AllExceptionsFilter (RFC-7807 problem+json)
│   │   ├── pipes/                     # ValidationPipe wrapper
│   │   └── i18n/                      # ar/en string bundles (ar is the MVP runtime locale)
│   ├── infrastructure/
│   │   ├── database/                  # TypeORM datasource, migrations, transactional helpers
│   │   ├── cache/                     # Redis module (ioredis)
│   │   ├── queue/                     # BullMQ module + worker registration
│   │   ├── mail/                      # Email port + SES/SendGrid adapter (see research.md)
│   │   ├── payments/                  # Payment port + MyFatoorah adapter (see research.md)
│   │   ├── storage/                   # Object-store port + R2/S3 adapter (presigned URLs)
│   │   ├── realtime/                  # Socket.io gateway + Redis pub/sub fan-out
│   │   └── observability/             # Pino logger, OpenTelemetry tracer, health checks
│   └── modules/                       # FEATURE MODULES — each independently testable
│       ├── auth/                      # Email-OTP login, JWT issuance, refresh, revoke (FR-001..FR-004)
│       ├── users/                     # Customer profile, addresses, favourites (FR-005)
│       ├── catalog/                   # Categories, services, search (FR-006)
│       ├── companies/                 # Company profile, KYC, gallery, slot-templates (FR-014, FR-017)
│       ├── company-users/             # Staff/owner accounts under a company (FR-017)
│       ├── slots/                     # Slot generation + atomic capacity decrement (FR-009)
│       ├── bookings/                  # Order lifecycle, dispatch, status history (FR-007..FR-013, FR-015, FR-016)
│       ├── dispatch/                  # Background worker: 3-attempt auto-reassignment (FR-015)
│       ├── payments/                  # Gateway integration, refunds, COD accruals (FR-010)
│       ├── coupons/                   # Validation + atomic usage counters (FR-011)
│       ├── reviews/                   # Customer reviews + single provider reply (FR-026, FR-027)
│       ├── notifications/             # Push + in-app + email channels (FR-028)
│       ├── admin/                     # Admin-only endpoints (FR-020..FR-025)
│       ├── settlements/               # Weekly settlement job, carry-forward balances (FR-037)
│       ├── reports/                   # Aggregate report endpoints (FR-025)
│       └── audit/                     # Audit log writer + admin reader (FR-032)
├── test/
│   ├── contract/                      # Supertest specs per module (SC-006)
│   ├── integration/                   # Testcontainers Postgres + Redis tests (slot race, coupon race)
│   ├── load/                          # k6 / autocannon scripts for SC-002 / SC-004 / SC-005
│   └── unit/                          # Domain-logic unit tests (no I/O)
├── migrations/                        # TypeORM migrations (numbered)
├── docker-compose.dev.yml             # Local Postgres + Redis + minio (S3) + mailhog
├── Dockerfile
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env.example
└── README.md
```

**Structure Decision**: **Modular monolith — single project, with clear module boundaries inside `src/modules/`.**

Why a monolith and not microservices:
- The PRD's MVP volume (~5k orders/month, ~50 companies) is well below microservice break-even.
- The architecture doc says "Modular Monolith في البداية" and pencils "Split into Microservices" only for the growth phase — the plan honours that.
- Cross-module operations critical to correctness (slot decrement + order create + payment authorise + coupon increment — all in one transaction) are dramatically simpler inside a monolith than across services.

Why these particular module boundaries:
- Each module owns its own tables, DTOs, controllers, and a contract-test file — so any module can later be lifted into a service with minimal surgery.
- `dispatch` and `settlements` are separate from `bookings` and `payments` because they are time-based (worker-driven) and benefit from their own scheduling lifecycle.
- `audit` is a module, not just a service helper, because the PRD requires admin reads of the audit trail (FR-024) — those endpoints belong somewhere.

## Complexity Tracking

The plan introduces no architecture beyond what the spec and the existing architecture doc already imply. The only deviation from a stricter "constitution-first" workflow is the empty constitution.

| Violation / Debt | Why it's here | Simpler alternative rejected because |
|------------------|---------------|-------------------------------------|
| Empty ratified constitution | Project initialised with template defaults; user wants forward momentum. | Blocking on constitution authoring would freeze MVP; informational gate + recommendation to run `/speckit.constitution` post-MVP is a lighter remedy. |
| Two infra dependencies (Postgres **and** Redis) instead of one | Atomic OTP rate limits, per-order dispatch timers, and sub-second cache for listing endpoints (SC-002) all need Redis. | Postgres-only design forces `SELECT … FOR UPDATE` on hot rows and a polling loop for dispatch — neither hits the latency targets at the planned scale. |
| Background-worker module (`dispatch` via BullMQ) instead of cron-only | The 5-minute accept window and 3-attempt cap demand precise per-order timers, not a polling cron. BullMQ delayed jobs map 1:1 to the rule. | A naive `pg_cron` poll either misses the latency target or floods the DB. |
| TypeORM transactional `QueryRunner` over Prisma | TypeORM gives explicit `START TRANSACTION` + manual `commit/rollback` control inside services — required for the slot+payment+coupon multi-row atomic flow (SC-005). | Prisma's interactive transactions are improving but still impose constraints (no shared locks across raw-SQL calls) that complicate the same flow. |

---

## Phase 0 — Outline & Research

See [research.md](./research.md). It resolves the four deferred decisions left open in the spec (email provider, payment gateway, object store, real-time transport) and locks the OTP code length, slot-grid defaults, dispatch-timer mechanism, geo-index strategy, audit-log substrate, and seed-data fixture.

## Phase 1 — Design & Contracts

- **Data model**: [data-model.md](./data-model.md) — Postgres tables, indexes, and the specific guards behind FR-009 (slot capacity), FR-011 (coupon usage), FR-015 (dispatch timers), and FR-037 (settlements carry-forward).
- **API surface**: [contracts/openapi.yaml](./contracts/openapi.yaml) — high-level sketch of the public surface; the live OpenAPI doc is generated at runtime from NestJS decorators and is the source of truth (SC-006 contract tests assert the two never diverge).
- **Quickstart**: [quickstart.md](./quickstart.md) — clone → install → docker-compose up → migrate → seed → smoke-test the first booking end-to-end.
- **Agent context update**: `update-agent-context.ps1` is invoked at the end of Phase 1 to refresh the agent's tech fingerprint.

## Post-Design Constitution Re-check

Re-evaluated after Phase 1. No new violations beyond those tracked above. **Gate result: PASS (informational).**

---

**Next command**: `/speckit.tasks` to derive the implementation task list from this plan.
