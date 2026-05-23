---
description: "Task list for SENAM Backend API"
---

# Tasks: SENAM Backend API Platform

**Input**: Design documents from `specs/001-senam-backend-api/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/openapi.yaml ✅, quickstart.md ✅

**Tests**: Included. The spec's SC-005 and SC-006 explicitly call for contract tests in CI and integration tests for concurrent-contention invariants (slot decrement, coupon redemption, first-to-accept). Per-story tests are written FIRST and must FAIL before the matching implementation task is started.

**Organization**: Tasks are grouped by user story. Phase 1 + Phase 2 are shared infrastructure; Phases 3–7 map to spec.md's User Story 1–5; Phase 8 is polish.

All paths are absolute or rooted at `senam_api/` (the backend project to be created next to the existing `senam_app/` Flutter project).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Stand up the NestJS project skeleton, tooling, and local dev environment.

- [X] T001 Scaffold the NestJS project at `senam_api/` with `nest new senam_api --strict --package-manager npm`, then prune the generated `*.spec.ts` example files.
- [X] T002 Add runtime dependencies in `senam_api/package.json`: `@nestjs/swagger`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@nestjs/throttler`, `@nestjs/schedule`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `@nestjs/bull`, `bullmq`, `typeorm`, `@nestjs/typeorm`, `pg`, `ioredis`, `class-validator`, `class-transformer`, `bcrypt`, `nestjs-pino`, `pino-http`, `nestjs-i18n`. Add dev deps: `jest`, `@nestjs/testing`, `supertest`, `testcontainers`, `@types/*`, `eslint`, `prettier`, `ts-node`.
- [X] T003 [P] Configure linting and formatting: write `senam_api/.eslintrc.cjs` (NestJS recommended + `eslint-plugin-import` order rules), `senam_api/.prettierrc`, and `senam_api/tsconfig.json` with `strict: true`, `noImplicitAny`, `exactOptionalPropertyTypes`.
- [X] T004 [P] Create `senam_api/docker-compose.dev.yml` with services: `postgres:15-postgis` (port 5432), `redis:7-alpine` (port 6379), `minio` (S3-compatible, ports 9000/9001), `mailhog` (ports 1025/8025). Add a named volume per stateful service.
- [X] T005 [P] Write `senam_api/.env.example` with every required key documented (DB url, Redis url, JWT secret, JWT TTLs, MyFatoorah keys/sandbox flag, SES keys/region, R2 keys/endpoint, dispatch timeout, settlement-cron expression, app base URL, log level).
- [X] T006 [P] Create `senam_api/src/config/` with a typed `ConfigService` (`class-validator`-validated env schema), exported as `ConfigModule.forRoot({ load: [loadConfig], validate })`. Fail-fast on missing or invalid env.
- [X] T007 [P] Create `senam_api/src/common/filters/all-exceptions.filter.ts` returning RFC-7807 `application/problem+json` with `correlationId`, and `senam_api/src/common/interceptors/correlation-id.interceptor.ts` that reads or generates an `x-correlation-id`. Wire both globally in `main.ts`.
- [X] T008 [P] Add `nestjs-pino` configuration in `senam_api/src/infrastructure/observability/logger.module.ts` (structured JSON, redact `authorization`, `password`, `card_*`).
- [X] T009 Mount Swagger in `senam_api/src/main.ts`: `SwaggerModule.setup('swagger', app, document)` only when `NODE_ENV !== 'production'`. Title "SENAM API", version `0.1.0-mvp`, bearer auth scheme.

**Checkpoint**: `npm run start:dev` boots the empty Nest app, `/swagger` renders, and `docker compose -f docker-compose.dev.yml up -d` produces a healthy Postgres+Redis+Minio+Mailhog cluster.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, infrastructure adapters, auth primitives, audit, and seed — everything the user-story phases depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Database schema (TypeORM migrations)

- [X] T010 Configure TypeORM datasource at `senam_api/src/infrastructure/database/data-source.ts` (synchronize OFF, migrations from `senam_api/migrations/*`). Wire `TypeOrmModule.forRootAsync` in `app.module.ts`.
- [X] T011 Write migration `senam_api/migrations/0001_extensions_and_users.ts`: enable `pgcrypto`, `citext`, `postgis`, then create `users` table per data-model.md §1 with anonymisation-friendly soft-delete columns.
- [X] T012 [P] Migration `senam_api/migrations/0002_addresses_favorites.ts`: `addresses` (with `geography(Point,4326)`) and `favorites`.
- [X] T013 [P] Migration `senam_api/migrations/0003_catalog.ts`: `categories`, `services`.
- [X] T014 [P] Migration `senam_api/migrations/0004_companies.ts`: `companies`, `company_users`, `company_documents`, `company_service_areas` (GIST index on `area`), `company_services` with `(company_id, service_id)` unique.
- [X] T015 [P] Migration `senam_api/migrations/0005_slots.ts`: `slot_templates`, `time_slots` with the `capacity_remaining >= 0` check and `UNIQUE(company_id, slot_start_at)`.
- [X] T016 [P] Migration `senam_api/migrations/0006_orders.ts`: `orders` with full status enum + dispatch_attempt; `order_status_history`. Add indexes per data-model.md §15.
- [X] T017 [P] Migration `senam_api/migrations/0007_payments.ts`: `payments`, `refunds`, `commission_accruals`.
- [X] T018 [P] Migration `senam_api/migrations/0008_coupons.ts`: `coupons` (with `used_count`), `coupon_usages` (PK `(coupon_id, order_id)`).
- [X] T019 [P] Migration `senam_api/migrations/0009_reviews.ts`: `reviews` (UNIQUE on `order_id`, `locked_at` column), `review_replies`.
- [X] T020 [P] Migration `senam_api/migrations/0010_notifications.ts`: `notifications` with partial index on `(user_kind, user_id) WHERE read_at IS NULL`.
- [X] T021 [P] Migration `senam_api/migrations/0011_rbac.ts`: `admin_users`, `roles`, `permissions`, `role_permissions`, `user_roles`. Insert seed rows for roles `super_admin`, `ops_admin`, `finance_admin`, `support_admin`.
- [X] T022 [P] Migration `senam_api/migrations/0012_audit_settlements.ts`: `audit_logs` (index on `(target_kind, target_id, at DESC)`), `settlements` (UNIQUE `(company_id, window_start)`), `settlement_lines`.

### Infrastructure adapters

- [X] T023 Create `senam_api/src/infrastructure/cache/redis.module.ts` exporting an `ioredis` singleton plus a `CacheService` (get/set with TTL, INCR-with-EXPIRE for rate limits).
- [X] T024 [P] Create `senam_api/src/infrastructure/queue/queue.module.ts` registering BullMQ queues `mail`, `dispatch`, `notifications`, `settlements`; expose typed `producers/*.ts`.
- [X] T025 [P] Define `MailPort` interface in `senam_api/src/infrastructure/mail/mail.port.ts` (`sendOtp`, `sendTransactional`). Implement `SesMailAdapter` and a local `MailhogMailAdapter` selected by env. The OTP send path enqueues a BullMQ job and returns immediately.
- [X] T026 [P] Define `PaymentPort` in `senam_api/src/infrastructure/payments/payment.port.ts` (`authorise`, `capture`, `refund`, `verifyWebhook`). Implement `MyFatoorahPaymentAdapter` (sandbox by default) with HMAC verification.
- [X] T027 [P] Define `ObjectStoragePort` in `senam_api/src/infrastructure/storage/object-storage.port.ts` (`presignUpload`, `presignDownload`). Implement `S3CompatibleAdapter` using `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, wired to R2 in prod and Minio in dev.
- [X] T028 [P] Create `senam_api/src/common/i18n/` with `ar/auth.json`, `ar/booking.json`, `ar/errors.json` plus a thin `nestjs-i18n` setup.

### Auth + audit + RBAC primitives

- [X] T029 Create `senam_api/src/modules/auth/auth.module.ts`. Implement `POST /v1/auth/otp/request`, `POST /v1/auth/otp/verify`, `POST /v1/auth/refresh`, `POST /v1/auth/logout`. Codes are 6-digit numeric, bcrypt-hashed in Redis at key `otp:{principal}:{email}`, TTL 10 minutes, single-use, with `@nestjs/throttler` rate-limits (3/hour/email, 5 verify attempts).
- [X] T030 Create JWT issuance helpers in `senam_api/src/modules/auth/tokens.service.ts`: access token (15 min, contains `{sub, principal, roles, companyId?}`), refresh token (30 days, rotated on each refresh, stored hashed in Redis at `refresh:{tokenId}` with TTL).
- [X] T031 [P] Create `senam_api/src/common/guards/jwt-auth.guard.ts`, `senam_api/src/common/guards/roles.guard.ts`, `senam_api/src/common/decorators/roles.decorator.ts`, `senam_api/src/common/decorators/current-user.decorator.ts`. Wire `JwtAuthGuard` as a global guard with a `@Public()` opt-out for `/auth/*`, `/healthz`, `/readyz`, webhooks.
- [X] T032 Create `senam_api/src/modules/audit/audit.module.ts` exporting `AuditService.write({...}, queryRunner)` that inserts an `audit_logs` row using the **same** `QueryRunner` as the caller's transaction. Add `@AuditAction(action)` method decorator that wraps service methods in a transaction and writes the audit row on success (FR-024, FR-032).
- [X] T033 Health endpoints in `senam_api/src/modules/health/health.controller.ts`: `GET /healthz` (process alive), `GET /readyz` (Postgres SELECT 1 + Redis PING).

### Seed CLI

- [X] T034 Create `senam_api/src/cli/seed.command.ts` (using `nestjs-command`) producing the fixtures listed in research.md §R10. Make it idempotent by upsert on stable slugs/emails. Add `npm run seed:dev` script.

**Checkpoint**: Migrations apply cleanly on an empty Postgres; `npm run seed:dev` populates the fixtures; `POST /v1/auth/otp/request` enqueues a Mailhog email; `POST /v1/auth/otp/verify` returns a JWT pair. Foundation ready — user-story phases can begin in parallel.

---

## Phase 3: User Story 1 — Customer signs up and books a car-wash (Priority: P1) 🎯 MVP

**Goal**: A first-time customer can register via email+OTP, browse companies in Doha, pick a service + slot + address + payment, and receive a confirmed booking.

**Independent Test**: Drive `quickstart.md` §4 end-to-end against a seeded company; the booking persists with `status='pending'`, the slot `capacity_remaining` decrements by 1, the payment authorise call returns success, and the order appears in `/v1/bookings?status=current`.

### Tests for User Story 1 ⚠️ (write FIRST, must FAIL before T044–T054)

- [X] T035 [P] [US1] Contract test `senam_api/test/contract/auth.contract.spec.ts` for `/auth/otp/request`, `/auth/otp/verify`, `/auth/refresh`, `/auth/logout` (status codes, payload shapes match `contracts/openapi.yaml`).
- [X] T036 [P] [US1] Contract test `senam_api/test/contract/customer-booking.contract.spec.ts` covering `/me`, `/me/addresses*`, `/companies`, `/companies/:id`, `/companies/:id/services`, `/companies/:id/slots`, `/coupons/validate`, `/bookings*`, `/uploads/presign`.
- [X] T037 [P] [US1] Integration test `senam_api/test/integration/customer-happy-path.spec.ts` using Testcontainers: full booking flow from OTP to confirmed order, asserting payment row created, slot decremented, audit row written.
- [X] T038 [P] [US1] Integration test `senam_api/test/integration/slot-race.spec.ts`: spin 200 concurrent `POST /bookings` requests against the same single-capacity slot; assert exactly **one** succeeds with 201, all others receive 409, and `capacity_remaining = 0` (SC-005).
- [X] T039 [P] [US1] Integration test `senam_api/test/integration/coupon-race.spec.ts`: 200 concurrent applies of a `total_cap=1` coupon; exactly one succeeds, `coupons.used_count = 1`, all others receive 409 (SC-005).
- [X] T040 [P] [US1] Integration test `senam_api/test/integration/service-area.spec.ts`: a customer with an address outside the Doha service polygon receives 422 on `POST /bookings` (FR-038).

### Implementation for User Story 1

- [X] T041 [P] [US1] TypeORM entities in `senam_api/src/modules/users/entities/{user,address,favorite}.entity.ts` matching data-model.md §1–§3.
- [X] T042 [P] [US1] `senam_api/src/modules/users/users.controller.ts` + `users.service.ts`: `GET /v1/me`, `PATCH /v1/me`, `DELETE /v1/me` (anonymisation per FR-036).
- [X] T043 [P] [US1] `senam_api/src/modules/users/addresses.controller.ts` + `addresses.service.ts`: full CRUD on `/v1/me/addresses*`. Validate `location` is well-formed `lat,lng` in QAT bounds.
- [X] T044 [P] [US1] `senam_api/src/modules/users/favorites.controller.ts` + service: list/add/remove `/v1/me/favorites`.
- [X] T045 [P] [US1] Catalog module at `senam_api/src/modules/catalog/`: `categories.controller.ts`, `services.controller.ts`, `search.controller.ts` (`/v1/categories`, `/v1/services`, `/v1/search` — last one with `ILIKE` + `unaccent` over name + description).
- [X] T046 [P] [US1] Companies module at `senam_api/src/modules/companies/`: entities, `companies.controller.ts` for `GET /v1/companies`, `GET /v1/companies/:id`, `GET /v1/companies/:id/services`. Listing uses PostGIS `ST_Distance(geography, :point)` for `sort=nearest`, and filters `status='active'` only.
- [X] T047 [US1] Slots module at `senam_api/src/modules/slots/`: `slot-template.entity.ts`, `time-slot.entity.ts`, `slots.service.ts` with two methods — `generateForDate(companyId, date)` (idempotent, called on read-miss and nightly), and `decrementCapacity(slotId)` running the single-statement UPDATE from data-model.md §11. Expose `GET /v1/companies/:id/slots`.
- [X] T048 [US1] Coupons module at `senam_api/src/modules/coupons/`: `POST /v1/coupons/validate` (read-only pricing preview). Implement `applyAtomically(couponId, userId, orderId, queryRunner)` as the multi-statement CTE from data-model.md §13/§14 — called from the bookings transaction, not as a separate endpoint.
- [X] T049 [US1] Payments module at `senam_api/src/modules/payments/`: `payments.service.ts` exposing `authoriseForOrder(order, method, returnUrl)` and `refund(paymentId, amount, reason)` against the `PaymentPort`. For `cod` the method records a `payments` row with `status='captured', amount=0` (placeholder) and a pending `commission_accruals` entry is queued instead. Implement `POST /v1/payments/webhook/myfatoorah` with HMAC verification.
- [X] T050 [US1] Bookings module at `senam_api/src/modules/bookings/`: `bookings.service.ts` `createBooking(dto)` runs **one** transaction that, in order: (a) validates customer + address service-area + active company + slot exists, (b) decrements slot capacity (T047), (c) applies coupon if present (T048), (d) computes totals + commission, (e) inserts the `orders` row with `status='pending'` and `dispatch_attempt=1`, (f) calls `PaymentPort.authorise` (online) or queues COD accrual, (g) writes the initial `order_status_history` row, (h) enqueues `dispatch.accept-timeout:{orderId}:1` with 5-min delay, (i) writes the `audit_logs` row. If any step fails, the whole transaction rolls back.
- [X] T051 [US1] Bookings controller endpoints: `POST /v1/bookings` (T050), `GET /v1/bookings`, `GET /v1/bookings/:id`, `POST /v1/bookings/:id/reorder` (clones a previous booking as a draft DTO returned to the client — no DB writes), `POST /v1/bookings/:id/cancel` (policy-based fee + refund per PRD §9.3; refund issued via `PaymentPort.refund`, slot capacity incremented back if allowed).
- [X] T052 [P] [US1] Uploads endpoint `senam_api/src/modules/users/uploads.controller.ts`: `POST /v1/uploads/presign` — authorisation check by `purpose`, returns presigned PUT URL + object key.
- [X] T053 [US1] Dispatch worker (minimal version, expanded in US2) `senam_api/src/modules/dispatch/dispatch.processor.ts`: a BullMQ consumer that, on timeout, marks the current attempt failed and triggers the next (full logic in T072).
- [X] T054 [US1] Wire all US1 modules into `app.module.ts`. Verify by running tests T035–T040.

**Checkpoint**: User Story 1 is independently functional. The quickstart §4 path passes end-to-end. SC-005's slot+coupon invariants hold under 200× concurrent contention. The customer can place a booking — but no provider can yet accept it (covered by US2).

---

## Phase 4: User Story 2 — Provider receives, accepts, and fulfils orders (Priority: P1)

**Goal**: A provider can log in, see incoming orders, accept within 5 minutes, advance through `accepted → on_the_way → arrived → in_progress → completed`, and view per-order commission breakdown. Unaccepted orders auto-reassign up to 3 times then terminate `unassignable` with an automatic refund.

**Independent Test**: Authenticate as the seeded provider-owner, accept a pending booking, advance through every status, and confirm: status_history rows exist with timestamps, `commission_accruals` is written on completion, the customer-side `/bookings/:id` reflects every change. Separately, seed an order against a provider whose owner is offline; with `DISPATCH_ATTEMPT_TIMEOUT_MS=5000`, observe attempt 1→2→3→`unassignable` plus a refund and audit row within 15 seconds.

### Tests for User Story 2 ⚠️

- [X] T055 [P] [US2] Contract test `senam_api/test/contract/provider.contract.spec.ts` for `/provider/me/*` endpoints and `/bookings/:id/status`.
- [X] T056 [P] [US2] Integration test `senam_api/test/integration/order-lifecycle.spec.ts`: full pending→completed lifecycle, asserts illegal transitions return 409.
- [X] T057 [P] [US2] Integration test `senam_api/test/integration/dispatch-reassignment.spec.ts`: with shortened timers, verifies attempt 1→2→3, then `unassignable` + refund + admin alert. Asserts FR-015's "max 3 attempts, max 15 minutes" bound.
- [X] T058 [P] [US2] Integration test `senam_api/test/integration/first-to-accept.spec.ts`: 50 concurrent accepts from different provider sessions against the same pending order; assert exactly one wins.

### Implementation for User Story 2

- [X] T059 [P] [US2] CompanyUsers module at `senam_api/src/modules/company-users/`: entity, `company-users.service.ts`, controllers for `GET/POST /v1/provider/me/staff` and `PATCH/DELETE /v1/provider/me/staff/:id` (owner-role only).
- [X] T060 [P] [US2] Provider self-management endpoints in `senam_api/src/modules/companies/provider-self.controller.ts`: `GET/PATCH /v1/provider/me/company` (profile, hours, slot template), `GET/POST /v1/provider/me/services` (within admin-imposed price bounds), KYC document upload via presigned URL.
- [X] T061 [US2] Bookings status transition in `senam_api/src/modules/bookings/status.service.ts`: implement the transition matrix from data-model.md §15. Each transition runs `UPDATE orders SET status=:to, ${to}_at=now() WHERE id=:id AND status=:from RETURNING id` and rejects (409) on 0 rows. Each transition writes an `order_status_history` row and emits an `order.status_changed` domain event (consumed in US3 by the realtime gateway).
- [X] T062 [US2] `POST /v1/bookings/:id/status` controller endpoint in `senam_api/src/modules/bookings/bookings.controller.ts` — RBAC: `provider_owner` and `provider_staff` (only on orders assigned to them) and `admin` may call it.
- [X] T063 [US2] `POST /v1/provider/me/orders/:id/assign` in `senam_api/src/modules/bookings/assignment.controller.ts` — owner assigns a `staff` user to an accepted order. Validates the staff belongs to the same company.
- [X] T064 [US2] Dispatch processor full implementation in `senam_api/src/modules/dispatch/dispatch.processor.ts`: on `dispatch.accept-timeout` firing, atomically check `orders.status='pending' AND dispatch_attempt=:attempt`; if true, increment `dispatch_attempt`, pick the next-best provider (nearest active not previously offered), update `orders.company_id`, write a status_history row, enqueue the next 5-min timer. On attempt 3 timeout, call `markUnassignable(orderId)`.
- [X] T065 [US2] `markUnassignable(orderId)` in `senam_api/src/modules/dispatch/dispatch.service.ts`: transitions the order to `unassignable`, increments slot `capacity_remaining` back to free the slot, calls `PaymentPort.refund` for online payments (or reverses the COD accrual), and writes an admin-alert notification via the notifications producer.
- [X] T066 [US2] Provider order inbox endpoint `GET /v1/provider/me/orders?status=...` in `senam_api/src/modules/bookings/provider-inbox.controller.ts`.
- [X] T067 [US2] Provider financials endpoint `GET /v1/provider/me/financials?from=&to=` in `senam_api/src/modules/companies/financials.controller.ts`: aggregate from `commission_accruals` joined with `orders`.
- [X] T068 [US2] Commission accrual writer: hook on `order.status_changed` to `completed` events, inside the same transaction, insert a `commission_accruals` row (`kind='online'` or `'cod'`, `gross_amount`, `commission_amount = round(gross * commission_bps / 10000)`). Update `companies.rejection_rate_pct` on each missed dispatch attempt.

**Checkpoint**: US1 + US2 work together. A customer can book and a provider can fulfil. The dispatch worker enforces the 3-attempt / 15-minute cap. No provider can accept twice. SC-009 is verifiable end-to-end.

---

## Phase 5: User Story 3 — Real-time tracking + reviews (Priority: P2)

**Goal**: The customer's client receives every order-status change in real time over WebSocket (P95 ≤ 2 s — SC-004), and after completion the customer can submit a multi-axis rating + photos; the company's aggregate rating recomputes; reviews lock after 48 hours.

**Independent Test**: Open a Socket.io client subscribed to `order:{id}`, advance the order through statuses on the provider side, and time the deliveries. After completion, `POST /bookings/:id/review` and `POST /reviews/:id/reply` exercise the review flow.

### Tests for User Story 3 ⚠️

- [X] T069 [P] [US3] Contract test `senam_api/test/contract/reviews.contract.spec.ts` for `/bookings/:id/review`, `/reviews/:id/reply`.
- [X] T070 [P] [US3] Integration test `senam_api/test/integration/realtime-status.spec.ts`: connect via socket.io-client, push 10 status changes, assert each is delivered in < 2 seconds end-to-end (SC-004).
- [X] T071 [P] [US3] Integration test `senam_api/test/integration/review-lock.spec.ts`: a review submitted with a backdated `created_at - 48h - 1s` is rejected from edit; one within the window is accepted.
- [X] T072 [P] [US3] Integration test `senam_api/test/integration/customer-cancel.spec.ts`: cancels at each policy boundary (PRD §9.3) and asserts correct fee + refund.

### Implementation for User Story 3

- [X] T073 [P] [US3] Realtime gateway `senam_api/src/infrastructure/realtime/realtime.gateway.ts`: Socket.io `@WebSocketGateway` with JWT auth on `handshake.auth.token`, per-room subscription (`order:{id}` enforces customer + assigned-company + admin only), Redis adapter via `socket.io-redis-adapter` for multi-replica fan-out.
- [X] T074 [P] [US3] Domain-event bus `senam_api/src/common/events/event-bus.ts`: lightweight NestJS `EventEmitter2` wrapper that also publishes to Redis pub/sub channel `events.order` so all replicas see the same event.
- [X] T075 [US3] Wire `order.status_changed` event emission inside the T061 transition flow; the realtime gateway subscribes and pushes to `order:{id}`.
- [X] T076 [P] [US3] Reviews module at `senam_api/src/modules/reviews/`: entities, `reviews.service.ts`, `POST /v1/bookings/:id/review` (must be `completed` order, unique per order, sets `locked_at = now() + 48h`), `POST /v1/reviews/:id/reply` (unique per review).
- [X] T077 [US3] Rating recomputation in `senam_api/src/modules/reviews/rating-aggregator.service.ts`: on review insert, run `UPDATE companies SET rating_avg = avg, rating_count = count` for the affected company; if `staff_id` is set, do the same on `company_users` (FR-027).
- [X] T078 [US3] Customer-side cancel-policy implementation in `senam_api/src/modules/bookings/cancel-policy.service.ts`: returns `{ feeAmount, refundAmount }` based on current status and timestamps per PRD §9.3. Called by `POST /bookings/:id/cancel` from T051.

**Checkpoint**: US1 + US2 + US3 all work. Real-time delivery is verified under load. Reviews lock correctly after 48 hours.

---

## Phase 6: User Story 4 — Admin operations (Priority: P2)

**Goal**: SENAM ops can approve companies, intervene on orders (force-cancel, refund, reassign), configure commissions, manage categories/services/coupons, run sales reports, and audit every privileged action.

**Independent Test**: Authenticate as the seeded `super_admin`, walk through every admin endpoint, and assert each privileged write produces an `audit_logs` row with `before`/`after` snapshots.

### Tests for User Story 4 ⚠️

- [X] T079 [P] [US4] Contract test `senam_api/test/contract/admin.contract.spec.ts` for all `/admin/*` endpoints.
- [X] T080 [P] [US4] Integration test `senam_api/test/integration/admin-intervene.spec.ts`: order intervene (refund_partial + cancel) produces a refund row, transitions the order, emits notifications to customer + provider, and writes an audit row.
- [X] T081 [P] [US4] Integration test `senam_api/test/integration/admin-rbac.spec.ts`: a `support_admin` (read-only) cannot call mutating admin endpoints — 403.

### Implementation for User Story 4

- [X] T082 [P] [US4] Admin auth: extend T029 to accept `principal=admin` and verify the email exists in `admin_users` and has at least one role. Roles are loaded into the JWT.
- [X] T083 [P] [US4] Admin companies controller `senam_api/src/modules/admin/companies.admin.controller.ts`: `GET /v1/admin/companies`, `POST /v1/admin/companies/:id/approve`, `POST /v1/admin/companies/:id/suspend`, `PATCH /v1/admin/companies/:id/commission` (RBAC: `super_admin`/`ops_admin`; `commission_bps` validated 1000–2500).
- [X] T084 [P] [US4] Admin orders controller `senam_api/src/modules/admin/orders.admin.controller.ts`: `GET /v1/admin/orders` (filter by status, date, company), `POST /v1/admin/orders/:id/intervene` dispatching to one of cancel / refund_full / refund_partial / reassign. Every action requires a `reason`, runs through `@AuditAction`, and triggers customer + provider notifications.
- [X] T085 [P] [US4] Admin coupons controller `senam_api/src/modules/admin/coupons.admin.controller.ts`: CRUD on `/v1/admin/coupons`.
- [X] T086 [P] [US4] Admin catalog controllers in `senam_api/src/modules/admin/catalog.admin.controller.ts`: CRUD on categories, services, with price-band updates.
- [X] T087 [US4] Reports module at `senam_api/src/modules/reports/`: `GET /v1/admin/reports/sales?from=&to=&categoryId=` aggregating from `orders` + `commission_accruals`. Use a covering index + pre-aggregate by day in SQL; the 12-month / 5-second budget (SC-008) is met by `(date_trunc('day', completed_at), company_id)` index.
- [X] T088 [US4] Audit read endpoint `senam_api/src/modules/audit/audit-search.controller.ts`: `GET /v1/admin/audit?targetKind=&targetId=&actorId=&from=&to=`.
- [X] T089 [US4] Notifications module at `senam_api/src/modules/notifications/`: persistence (`notifications` table), `GET /v1/notifications`, `POST /v1/notifications/:id/read`, BullMQ producer that fans out to channels (in-app immediately; push queued for FCM/APNs adapter implementation later — see plan §research open follow-ups). Internal API used by US2 dispatch, US4 admin intervene, US3 review reply, etc.

**Checkpoint**: US1–US4 complete. Every privileged admin action is audited. Reports return within the SC-008 budget.

---

## Phase 7: User Story 5 — Provider settlements (Priority: P3)

**Goal**: A weekly cron computes per-company settlements netting cash-commission accruals and prior-window carry-forward (per Clarification Q4), producing immutable settlement rows and downloadable statement PDFs. Admins mark settlements `paid` with a payout reference.

**Independent Test**: Seed a week of mixed online + COD orders and refunds for one company; trigger the settlement job; assert the produced settlement matches a manual calculation; re-run the job and assert exactly one row exists (idempotency).

### Tests for User Story 5 ⚠️

- [X] T090 [P] [US5] Contract test `senam_api/test/contract/settlements.contract.spec.ts` for `/admin/settlements*` and `/provider/me/settlements*`.
- [X] T091 [P] [US5] Integration test `senam_api/test/integration/settlement-compute.spec.ts`: builds a 7-day fixture (10 online, 3 COD, 2 partial refunds, 1 prior-window negative balance), runs the job, asserts every aggregate matches a hand-calculated expected value to the cent.
- [X] T092 [P] [US5] Integration test `senam_api/test/integration/settlement-idempotent.spec.ts`: running the job twice for the same window produces no duplicate settlement rows.

### Implementation for User Story 5

- [X] T093 [P] [US5] Settlements module at `senam_api/src/modules/settlements/`: entities, `settlements.service.ts.computeWindow(companyId, windowStart)` running the SQL described in data-model.md §19. Window boundaries computed in `Asia/Qatar` then converted to UTC. The `UNIQUE(company_id, window_start)` constraint makes the job idempotent.
- [X] T094 [US5] Cron registration in `senam_api/src/modules/settlements/settlements.scheduler.ts`: BullMQ repeatable job firing every Sunday 00:30 Asia/Qatar; for each active company, enqueue a `settlement.compute` job for the closed window.
- [X] T095 [P] [US5] Statement PDF generation `senam_api/src/modules/settlements/statement.service.ts`: build from `settlement_lines` (derived join over `commission_accruals` + `refunds`), render via `pdfkit` to a streamed response; expose at `GET /v1/provider/me/settlements/:id/statement.pdf`.
- [X] T096 [P] [US5] Provider settlements controller `senam_api/src/modules/settlements/provider-settlements.controller.ts`: `GET /v1/provider/me/settlements`.
- [X] T097 [US5] Admin settlements controller `senam_api/src/modules/settlements/admin-settlements.controller.ts`: `GET /v1/admin/settlements`, `POST /v1/admin/settlements/:id/mark-paid` (requires `payoutReference`, audited).
- [X] T098 [US5] Carry-forward alert: when `computeWindow` produces a `net_amount` whose absolute value exceeds `CARRY_FORWARD_ALERT_THRESHOLD`, emit a notification to all `finance_admin` users.

**Checkpoint**: Settlements close every Sunday automatically. Negative balances roll forward. The PDF statement is downloadable by the provider. Admin can mark payments as completed with a bank reference.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: SLA verification, packaging, security review, docs.

- [X] T099 [P] Load script `senam_api/test/load/customer-listing.k6.js` targeting `/companies?sort=nearest` and `/companies/:id/services` at 10k VUs sustained for 10 minutes; assert P95 < 300 ms, P99 < 800 ms (SC-002).
- [X] T100 [P] Load script `senam_api/test/load/realtime-status.k6.js` measuring socket-receive latency for 5k subscribed clients during a status-update burst; assert P95 ≤ 2 s (SC-004).
- [X] T101 [P] Contract-doc congruence test `senam_api/test/contract/openapi-congruence.spec.ts`: parses `specs/001-senam-backend-api/contracts/openapi.yaml` and the live `/swagger.json` and asserts every path + method in one exists in the other (SC-006).
- [X] T102 [P] Backup/restore drill script `senam_api/scripts/db-restore-drill.sh`: dumps a snapshot, restores into a fresh container, runs the integration suite against the restored DB. Document the procedure in `senam_api/docs/operations.md`. Target: restore + smoke-test in under 1 hour (SC-007).
- [X] T103 [P] Security review pass in `senam_api/docs/security-review.md`: walk OWASP API Top 10, OTP brute-force resistance, JWT secret rotation procedure, refresh-token revocation under compromise, presigned-URL expiry windows, rate-limit headroom.
- [X] T104 [P] Production `senam_api/Dockerfile` (multi-stage, distroless or node:20-alpine), `.dockerignore`, and `docker-compose.prod.yml` for reference deployment.
- [X] T105 [P] Top-level `senam_api/README.md` summarising the project: prerequisites, scripts, env keys, link to `specs/001-senam-backend-api/`.
- [X] T106 Run the full `quickstart.md` end-to-end on a clean machine; record any drift in the doc, then commit fixes.
- [X] T107 Recommend running `/speckit.constitution` to ratify a real constitution before further phases — note that the planning gate has been deferred (see plan.md Complexity Tracking).

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)**: no dependencies — start here.
- **Phase 2 (Foundational)**: depends on Phase 1 — **blocks every user-story phase**.
- **Phase 3 (US1)**: depends on Phase 2. MVP cut-off.
- **Phase 4 (US2)**: depends on Phase 2 + Phase 3 (uses the bookings entity, dispatch worker stub, and the cancellation policy from US1).
- **Phase 5 (US3)**: depends on Phase 2 + Phase 4 (uses the `order.status_changed` event emitted from T061).
- **Phase 6 (US4)**: depends on Phase 2; uses `commission_accruals` from US2 for reports — runs in parallel with US3 once US2 is done.
- **Phase 7 (US5)**: depends on US2 (commission accruals) and US4 (admin endpoints).
- **Phase 8 (Polish)**: after all desired user stories.

### Within each user story

- Tests in the "Tests for User Story N" block are written first and must FAIL on the empty implementation.
- Models / entities are created before services that depend on them.
- Services are wired before controllers.
- Each story is a complete, independently testable, deployable increment.

### Parallel opportunities

- All `[P]` tasks within Phase 1 run in parallel.
- All migration `[P]` tasks (T012–T022) run in parallel — they touch different files. T010 (datasource) and T011 (first migration with extensions) must complete first.
- All infrastructure-adapter `[P]` tasks (T023–T028) run in parallel after T010.
- All `[US1]` test tasks (T035–T040) run in parallel.
- All `[US1]` model/controller tasks marked `[P]` run in parallel (T041, T042, T043, T044, T045, T046, T052).
- Phase 5 and Phase 6 can run in parallel once Phase 4 is complete (different files, no story dependency).
- Phase 8 polish tasks all `[P]`.

### Parallel example — User Story 1 kick-off

```bash
# After Phase 2 completes, launch in parallel:
Task: "Contract test for auth in senam_api/test/contract/auth.contract.spec.ts"          # T035
Task: "Contract test for customer booking in senam_api/test/contract/customer-booking.contract.spec.ts"  # T036
Task: "Integration test happy-path in senam_api/test/integration/customer-happy-path.spec.ts"   # T037
Task: "Integration test slot-race in senam_api/test/integration/slot-race.spec.ts"        # T038
Task: "Integration test coupon-race in senam_api/test/integration/coupon-race.spec.ts"    # T039
Task: "Integration test service-area in senam_api/test/integration/service-area.spec.ts"  # T040

# Then in parallel:
Task: "User/Address/Favorite entities in senam_api/src/modules/users/entities/"           # T041
Task: "Catalog module in senam_api/src/modules/catalog/"                                  # T045
Task: "Companies module skeleton in senam_api/src/modules/companies/"                     # T046
Task: "Uploads endpoint in senam_api/src/modules/users/uploads.controller.ts"             # T052
```

---

## Implementation Strategy

### MVP-first (User Story 1 only)

1. Phase 1 + Phase 2 → foundation ready.
2. Phase 3 (US1) → customer can book.
3. **STOP and VALIDATE** with quickstart §4 + integration suite.
4. Demo-ready: a customer journey works end-to-end; provider acceptance is mocked manually for the demo.

### Incremental delivery

1. Setup + Foundational + US1 → MVP demo (customers can book).
2. US2 → providers can actually fulfil. **First production-eligible cut.**
3. US3 → real-time tracking + reviews. Customer experience matches PRD §5.1.5–§5.1.6.
4. US4 → admin tooling. Operationally manageable.
5. US5 → automated settlements. Sustainable.
6. Polish → SLA verification + security review.

### Parallel team strategy

After Phase 2:

- Developer A: Phase 3 (US1).
- Developer B: starts Phase 4 (US2) skeletons (CompanyUsers, provider self-management) — final lifecycle work waits on US1 entities.
- Developer C: starts Phase 6 (US4) admin controllers as soon as the relevant US1/US2 entities exist.

---

## Notes

- Every task has a unique ID, a file path, and a phase label. The `[P]` marker means "different files, no dependencies on incomplete tasks in this phase."
- Tests written first must FAIL before implementation begins — verify the red→green transition for each US block.
- Commit after each task (or each logical group within a task) so the audit trail mirrors the task list.
- The `audit_logs` table is the source of truth for "who did what when" — every admin write goes through `@AuditAction`.
- The OpenAPI doc at `/swagger.json` is the runtime source of truth; `contracts/openapi.yaml` is the spec sketch and T101 keeps them congruent.
- Stop at any **Checkpoint** to validate the user-story slice independently.
