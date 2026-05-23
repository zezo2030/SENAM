# Phase 0 Research — SENAM Backend API

Resolves the deferred technology choices from `spec.md` (Assumptions section) and the small set of NEEDS-CLARIFICATION-shaped questions that remained after `/speckit.clarify`. Each entry follows: **Decision → Rationale → Alternatives considered**.

---

## R1. Transactional email provider for OTP delivery

**Decision**: Use **Amazon SES** as the primary provider behind a `MailPort` interface; the adapter is swappable.

**Rationale**:
- Pricing is the lowest of the credible options at the SENAM MVP volume (62k emails/month projected: 10k users × ~6 OTPs/user/month, plus order receipts and provider alerts). SES is $0.10 per 1,000 sent.
- AWS region `me-south-1` (Bahrain) provides low-latency send from the same region likely to host the API; this matters because OTP perceived latency is dominated by mail-server round-trip.
- Suppression-list, bounce, and complaint webhooks are first-class and feed back cleanly into our `users.email_verified` lifecycle.
- The architecture doc lists S3 and AWS-style infrastructure already (`screenshot/SENAM_Architecture.html`), so AWS account presence is a given.

**Alternatives considered**:
- **SendGrid**: best deliverability reputation but >5× cost at this volume and an extra vendor relationship; rejected.
- **Postmark**: excellent for transactional but pricing tier change at ~10k emails/month makes it expensive past launch; rejected.
- **Mailgun**: comparable to SES but the EU/MENA delivery pool has historically been weaker; rejected.
- **Self-hosted Postfix/MailerSend**: deliverability risk; rejected for MVP.

**Implementation notes for the `MailPort`**: a single interface `sendOtp(email, code, locale)` plus `sendTransactional(template, vars, locale)`. The adapter holds nothing user-visible — all subject/body text comes from the `i18n/ar/*.json` bundles. Outbound mail is queued through BullMQ so that a transient SES blip never blocks an OTP HTTP request: the API call returns immediately with `code_sent: true` once the job is enqueued, and the worker delivers within seconds.

---

## R2. Payment gateway

**Decision**: Use **MyFatoorah** as the primary card/wallet gateway behind a `PaymentPort` interface; the adapter is swappable.

**Rationale**:
- Qatar coverage is the hard constraint — MyFatoorah supports QAR, Naps (Qatari debit), Visa/Mastercard, Apple Pay, and Google Pay in a single integration. PRD §11 already names it.
- Tokenisation flow (`InitiatePayment` → `ExecutePayment` → webhook) keeps card PAN entirely off SENAM infrastructure (PCI scope reduction goal).
- Sandbox account creation is self-serve; this unblocks integration testing without a commercial agreement.
- Refund API exposes both partial and full refunds keyed by their original `PaymentId`, which matches the admin-refund and unassignable-auto-refund flows (FR-022, FR-015).

**Alternatives considered**:
- **Tap Payments**: similar feature set, slightly less Qatar-specific. Holding it as the documented swap target if MyFatoorah negotiations stall.
- **Stripe**: not licensed for Qatar card processing in 2026; rejected.
- **Direct Naps integration**: bank-level integration, multi-month onboarding, rejected for MVP.

**Implementation notes for the `PaymentPort`**: methods `authorise(orderId, amount, currency, returnUrl)`, `capture(paymentId)` (one-step for MVP — we capture immediately on customer confirmation), `refund(paymentId, amount, reason)`, plus a webhook receiver verifying HMAC. The `payments` module persists the gateway `payment_id`, raw status, and the SENAM-side state separately, so admins can always reconcile a webhook against an order.

---

## R3. Object storage

**Decision**: Use **Cloudflare R2** behind an `ObjectStoragePort` (S3-compatible API).

**Rationale**:
- Zero egress fees — critical for serving company gallery images to the mobile app at scale.
- S3 API compatibility means the same code path tests against `minio` locally and `R2` in prod.
- Pricing at the MVP image volume is well under $5/month — negligible.
- Architecture doc explicitly lists "S3 / Cloudflare R2" as the planned store.

**Alternatives considered**:
- **AWS S3 + CloudFront**: equivalent feature set, much more expensive on egress. Held as backup.
- **Direct DB byte storage**: rejected; PRD-scale image volumes (~50 companies × 10 gallery images + KYC docs + review photos) would bloat Postgres backups and degrade query performance.

**Implementation notes**: all uploads are **presigned PUT** URLs issued by the backend after authorisation checks. The backend stores only the object key and content-type; it never proxies bytes. Reads are presigned GET URLs with a short TTL for KYC docs and longer TTL for gallery images.

---

## R4. Real-time transport for order tracking

**Decision**: **Socket.io over WebSocket** (with long-polling fallback), backed by **Redis pub/sub** for horizontal-scale fan-out.

**Rationale**:
- The Flutter customer app and the React provider dashboard both have well-maintained Socket.io clients; building two custom WebSocket clients buys nothing.
- NestJS ships first-class `@nestjs/platform-socket.io` integration that exposes gateways as classes alongside controllers — keeping the realtime endpoints in the same module that owns the resource (e.g., `bookings.gateway.ts` next to `bookings.controller.ts`).
- Redis pub/sub gives us cheap fan-out across replicas: any node that updates an order's status publishes to `order:{id}` and every subscribed socket on any node receives it.
- Long-polling fallback covers the corporate-network case where customers can't hold a persistent connection — addresses the "polling allowed as fallback" sentence in the spec assumptions.

**Alternatives considered**:
- **Server-Sent Events**: simpler protocol, but unidirectional only. Provider-side chat (PRD §5.1.5 "Chat with company") needs client→server too; rejected.
- **Pusher / Ably**: vendor lock-in and per-connection pricing that breaks at SENAM's growth target; rejected for MVP.
- **Postgres `LISTEN/NOTIFY`**: tempting because there's no extra dependency, but it doesn't scale past one DB connection per node and provides no offline buffer; rejected.

**Implementation notes**: each authenticated socket subscribes to channels keyed by what the user is allowed to see (`order:{id}` for customers and the assigned provider; `provider:{companyId}:inbox` for owner-role notifications). Auth is by passing the same JWT in the Socket.io handshake. SC-004 (P95 ≤ 2 s for status delivery) is measured from the moment the provider's `POST /bookings/:id/status` returns 200 to the moment the customer's socket receives the event.

---

## R5. OTP code parameters

**Decision**: 6-digit numeric code, 10-minute TTL, single-use, bcrypt-hashed at rest, rate-limited at **3 issuances per email per hour** and **5 verification attempts per code**.

**Rationale**:
- 6-digit numeric matches the standard most users already know from banking apps and the original PRD's SMS-OTP UX.
- 10 minutes is comfortable for email delivery jitter (SES typical delivery is sub-10 s but worst-case spam-filter handling can take minutes).
- Single-use prevents replay; bcrypt hash with workfactor 10 prevents OTP recovery in a database leak without measurable latency cost.
- Issuance and verification limits are stored in Redis (`INCR` + `EXPIRE`) so they reset cleanly and don't touch Postgres on every login attempt.

**Alternatives considered**:
- **8-digit code**: marginal security gain, lower memorisability, slightly worse UX over email; rejected.
- **TOTP**: requires authenticator app setup — incompatible with first-touch onboarding; rejected.
- **Magic link**: tempting but requires a mobile deep-link with Flutter that's an extra integration; reconsidering for v2 alongside the customer app maturity.

---

## R6. Slot generation defaults

**Decision**: Default `SlotTemplate` on company onboarding — slot duration **60 minutes**, capacity **2 concurrent orders per slot**, operating-hour window **08:00–22:00 local (Asia/Qatar)**, days **Saturday–Thursday**.

**Rationale**:
- A car-wash typically takes 30–60 minutes; 60-minute slots with capacity 2 lets a small two-bay shop accept two parallel orders without overcommitting.
- The defaults are intentionally easy to override per company in the owner dashboard.
- Friday off matches the local rest-day default but is a one-click toggle.

**Alternatives considered**:
- 30-minute slots with capacity 1: feels granular but explodes the slot-row count and makes the UI cluttered for car-wash MVP volumes.
- 120-minute slots: too coarse; would block a shop from booking back-to-back small services.

---

## R7. Atomic dispatch timing mechanism

**Decision**: **BullMQ delayed jobs** keyed on order ID drive the per-attempt 5-minute timers; **Redis transactions** (`MULTI`/`EXEC`) drive per-provider exclusivity within a tick; PostgreSQL row locking is the final source of truth for the "first-to-accept-wins" race.

**Rationale**:
- When a new order is created, we enqueue `dispatch.accept-timeout:{orderId}:attempt:1` with a 5-minute delay. If the provider accepts before the timer fires, the job-key is removed by the accept handler. If it fires first, the worker promotes attempt 2 (and so on up to 3 per FR-015).
- This makes the 15-minute total budget a direct sum of 3 delayed jobs, not an emergent property of a polling loop — i.e., easy to reason about and test.
- BullMQ's atomic `getNextJob` semantics prevent two replicas from running the same timeout twice.
- The "first provider to accept wins" race is settled in Postgres via `UPDATE orders SET status='accepted', assigned_company_id=:id WHERE id=:order_id AND status='pending' RETURNING id` — a single round-trip with a unique outcome per order.

**Alternatives considered**:
- **`pg_cron` polling every 30 seconds**: simpler but loses the per-order accuracy required for SC-009's "no order in dispatch > 15 minutes" assertion.
- **In-process `setTimeout`**: works on one node, breaks on N replicas. Rejected.

---

## R8. Indexing strategy for location-based listing

**Decision**: Use **PostGIS** (or, as a smaller initial dependency, the built-in `earthdistance` + `cube` extension) for nearest-company queries; fall back to a plain Haversine SQL if PostGIS adds operational overhead the team isn't ready for.

**Rationale**:
- The customer "list companies sorted by distance" endpoint (FR-007) is the single hottest query in the API. A GIST index on a `geography(Point, 4326)` column delivers sub-millisecond nearest-neighbour lookups at MVP scale.
- PostGIS also unblocks the future "service area polygon" check (FR-038) — a company's service polygon is a `geography(MultiPolygon)` column, and the customer-in-polygon predicate is `ST_Covers(area, customer_point)`.

**Alternatives considered**:
- **Elasticsearch geo queries** (per architecture doc): excellent but adds a third infra component the MVP doesn't need yet. Kept as a documented growth step.
- **`earthdistance`-only**: works for "nearest" but not for polygon coverage. Acceptable as a starting point if PostGIS install is blocked, but commits to a migration later.

---

## R9. Audit logging substrate

**Decision**: Append-only `audit_logs` table in Postgres, written inside the same transaction as the privileged write so auditing is atomic with the action; a daily archival job exports rows older than 90 days to cold S3 storage.

**Rationale**:
- Atomic in-transaction insertion is the only way to guarantee "no privileged write goes unaudited" (FR-024). Out-of-band logging (e.g., Pino + log shipper) drops records on crash.
- 90-day hot-table retention with cold archival keeps the table small enough that admin search stays fast (SC-008) while still meeting accounting retention needs.

**Alternatives considered**:
- **CDC (logical replication) → external log store**: solves scale eventually but introduces a window where unshipped events would be lost in a crash. Held for growth phase.
- **Application-level logger only**: not durable enough for compliance use. Rejected.

---

## R10. Test-data seed strategy

**Decision**: A small `seed:dev` Nest CLI command (idempotent) inserts:
- 1 super-admin user, 1 admin user.
- 3 companies (one approved + active, one pending KYC, one suspended) in Doha with sample slot templates.
- 5 services across 2 categories.
- 5 customers (one in Doha, one outside the service area).
- 1 active coupon and 1 expired coupon.

**Rationale**: Enables the quickstart smoke test (next document) to be a single command, and gives the contract-test suite a known fixture without depending on hand-edited SQL files.

---

## Open follow-ups (non-blocking)

- **Push notifications (FCM/APNs)**: deferred to a future `notifications` adapter — out of scope for the API contract surface in this round (the API just persists the notification record and emits a "push pending" event).
- **Analytics warehouse / event stream**: explicitly out of scope for MVP per spec Assumptions; the operational schema is designed not to block one later (no overuse of triggers, all state changes carry timestamps).
