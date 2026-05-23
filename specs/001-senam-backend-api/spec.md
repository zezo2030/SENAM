# Feature Specification: SENAM Backend API Platform

**Feature Branch**: `001-senam-backend-api`
**Created**: 2026-05-20
**Status**: Draft
**Input**: User description: "i need creat the backend usitn nest js and swager for api and postgress based the senam_app + screenshot"

> **Context note**: The user requested specific technology choices (NestJS, Swagger/OpenAPI, PostgreSQL). Those are captured here as **assumptions/constraints** because they are pre-decided by the user, but the body of this spec describes *what the backend must do* in technology-agnostic terms. Detailed framework/library/schema decisions belong in the `/speckit.plan` phase. Inputs reviewed: `senam_app/` (Flutter project skeleton, `pubspec.yaml`, `lib/` with `app/`, `core/`, `features/`) and `screenshot/SENAM_PRD.md` (full SENAM v1.0 PRD).

## Clarifications

### Session 2026-05-20

- Q: How are bookable time slots modelled? → A: Fixed grid per company — provider configures slot duration and per-slot capacity; customer picks from generated slot rows.
- Q: Who owns user identity, and what channel delivers the OTP? → A: SENAM owns identity (issues its own access + refresh tokens); login uses **email + one-time code delivered by email** for all principals (customer, provider, admin). This supersedes the PRD's phone+SMS OTP description. Phone number is kept as an optional contact field on the customer profile so providers/technicians can still call the customer, but it is not an identity credential.
- Q: How are technicians modelled? → A: A technician **is** a `CompanyUser` with role `staff`. They authenticate with their own email-OTP login, can be assigned orders by their company's owner role, update order status themselves through the lifecycle, and accrue per-person ratings and completed-order counts.
- Q: How is SENAM's commission collected on cash-on-delivery orders? → A: Netted off the next weekly settlement — each cash order accrues a "commission owed" entry; the weekly statement = (online gross − commission − refunds) − (cash-order commissions). The net amount may be negative; negative balances carry forward to the following week and trigger an admin review flag.
- Q: How many providers are tried before an order is marked unassignable? → A: Up to 3 dispatch attempts in priority order (nearest active qualifying provider not previously offered the same order), each with the standard 5-minute accept window, for a combined cap of 15 minutes. If none accept, the order moves to `unassignable`, the customer's payment is refunded in full, and the case is surfaced on the admin dashboard for manual recovery.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer signs up and books a car-wash service (Priority: P1)

A customer in Doha opens the SENAM mobile app, registers using their phone number, browses car-wash companies near them, picks a service, time slot, and address, pays online, and receives a confirmed booking. This is the platform's primary revenue-generating path — without it there is no MVP.

**Why this priority**: The PRD's MVP is "vertical-first" on car wash in Doha (PRD §4.1, §5). Customer onboarding + first booking is the single flow that has to work for the business to exist. Every other capability (provider, admin, reviews, coupons) is meaningful only after a customer can place a paid order.

**Independent Test**: Drive the public API end-to-end from a test client: request OTP → verify → complete profile → list companies for a category and location → fetch service catalog of one company → create a booking with a time slot, address, and payment method → confirm the booking transitions to a "confirmed" state, the payment is recorded, and the order is retrievable in the customer's order history. Provider/admin sides can be stubbed with seeded data; the customer journey must be exercisable on its own.

**Acceptance Scenarios**:

1. **Given** an unregistered email address, **When** the customer requests an OTP and submits the correct 6-digit code (delivered to that email) within its validity window, **Then** the backend creates (or returns) the user account keyed by email and issues access + refresh tokens.
2. **Given** an authenticated customer with a saved address in Doha, **When** they list companies filtered by the car-wash category sorted by distance, **Then** the backend returns only active, approved companies that serve that area, with rating, distance, and starting price.
3. **Given** a chosen company, service, address, and an available time slot, **When** the customer creates a booking with an online payment method, **Then** the backend reserves the slot, charges the payment provider for the full amount, persists the order in `confirmed` status, and emits a "new order" event for the provider.
4. **Given** a confirmed booking, **When** the customer fetches their order history, **Then** the order appears under "current" with its status, ETA fields, totals, and the assigned company information.

---

### User Story 2 - Provider receives, accepts, and fulfils orders (Priority: P1)

A service company logs into the provider dashboard, sees incoming orders in real time, accepts them within the 5-minute window, advances the order through the lifecycle states (on the way → arrived → in progress → completed), and sees its earnings and commission breakdown.

**Why this priority**: A booking that no provider can act on is dead. P1 because the order must reach a fulfilment state for the customer journey in Story 1 to actually complete, and because the 5-minute accept-or-reject rule and status lifecycle are core business rules (PRD §9.4, §5.1.5).

**Independent Test**: Authenticate as a provider, list new orders, accept one before its 5-minute deadline, transition it through each lifecycle status, and confirm: (a) each transition is persisted with timestamps, (b) the customer-facing order endpoint reflects the new status, (c) auto-reassignment fires for a separate order that is not accepted in time.

**Acceptance Scenarios**:

1. **Given** a confirmed order assigned to a provider, **When** the provider accepts it within 5 minutes of creation, **Then** the order moves to `accepted` and the provider can update further statuses.
2. **Given** a confirmed order that no provider accepts within 5 minutes, **When** the deadline elapses, **Then** the order is automatically re-offered to another qualifying provider (or marked `unassigned` if none) and the original provider's rejection rate is updated.
3. **Given** an accepted order, **When** the provider advances status to `on_the_way`, `arrived`, `in_progress`, and `completed` in order, **Then** each transition is recorded in order status history with the actor and timestamp, and invalid transitions (e.g., `completed` → `on_the_way`) are rejected.
4. **Given** a completed order paid online, **When** the provider views their financial report, **Then** the order appears with gross amount, SENAM commission, and net payout, and contributes to the next weekly settlement.

---

### User Story 3 - Customer tracks the order in real time and rates it after completion (Priority: P2)

The customer follows their order through the live status pipeline, sees the technician's location/ETA where applicable, can chat or call the provider, and after completion submits a 1–5 star review with optional comment and photos.

**Why this priority**: Tracking and reviews are core differentiators for SENAM's "premium / trusted" positioning (PRD §1.3, §5.1.5, §5.1.6), but the booking can technically be created and fulfilled without them. P2 because the rating loop drives provider ranking and retention but is not strictly required for first-week revenue.

**Independent Test**: Subscribe to the real-time order channel for a known order ID, advance the order through provider-side transitions, and verify each status change is delivered to the customer client within the agreed latency. After completion, submit a review and verify it appears on the company's public profile after the moderation window.

**Acceptance Scenarios**:

1. **Given** an in-progress order, **When** the provider updates its status, **Then** the customer's subscribed client receives the update in real time without polling.
2. **Given** a completed order, **When** the customer submits a 4-star review with a comment, **Then** the review is stored, the company's average rating is recalculated, and the customer cannot re-edit the review after 48 hours.
3. **Given** an order in `confirmed` status, **When** the customer cancels it before the provider accepts, **Then** the order is cancelled at no charge and the captured payment is refunded in full.
4. **Given** an order that has already started, **When** the customer attempts to cancel it, **Then** the API rejects the cancellation per the published policy.

---

### User Story 4 - Admin manages companies, orders, commissions, and disputes (Priority: P2)

The SENAM operations team uses the admin dashboard to approve new companies (KYC), monitor live orders, intervene when needed (refund, reassign, cancel), configure commission rates per company, manage categories/services, run coupons, moderate reviews, and pull financial and operational reports.

**Why this priority**: The platform cannot be operated commercially without admin tooling — but the operational surface is wide. P2 because a small subset (company approval, commission config, order intervention) is needed for go-live; the rest can grow over the first weeks.

**Independent Test**: As an admin role, exercise: approve a pending company application; set a custom commission rate; intervene on an active order (refund + cancel); create a percentage-discount coupon with an expiry and per-user usage limit; pull a date-ranged orders report. Each capability is independently demonstrable.

**Acceptance Scenarios**:

1. **Given** a pending company with submitted KYC documents, **When** an admin approves it, **Then** the company becomes visible in customer listings and the approval is auditable.
2. **Given** an active order in a disputed state, **When** an admin issues a partial refund and changes its status to `cancelled`, **Then** the payment provider is instructed to refund the specified amount and both customer and provider receive notifications.
3. **Given** a coupon configured for 10% off with a per-user limit of 1 and a total cap of 500 uses, **When** a customer applies it, **Then** the discount is validated against the limits and the usage counters are incremented atomically (no over-redemption under concurrency).
4. **Given** a date range and a category filter, **When** the admin requests a sales report, **Then** the API returns aggregate GMV, order count, average order value, and commission earned for the period.

---

### User Story 5 - Provider settlements and weekly payouts (Priority: P3)

Every week SENAM closes a settlement window per company: sum of completed online-paid orders minus commission and any pending refunds/adjustments, producing a payable amount and an invoice the company can download.

**Why this priority**: Required for sustainable operations (PRD §9.2 "weekly settlement every Sunday"), but for the first weeks of MVP it can be operated manually from raw reports while the automated module is built. P3.

**Independent Test**: Seed a week of completed and refunded orders for a single company, trigger the settlement job for that window, and verify the produced settlement record matches a manual calculation. Verify idempotency: re-running the job for the same window produces no duplicate settlements.

**Acceptance Scenarios**:

1. **Given** a closed weekly window with N completed online-paid orders, **When** the settlement job runs, **Then** exactly one settlement record is produced per company with the correct gross, commission, refund, and net amounts.
2. **Given** a settlement marked `paid`, **When** an admin queries it, **Then** the linked orders, computation breakdown, and payout reference are retrievable.

---

### Edge Cases

- **Duplicate OTP requests**: the same email requests OTP repeatedly within a short window — the backend must rate-limit issuance (per email and per IP) and reuse the existing live code rather than generating a fresh one on every call.
- **Time-slot race**: two customers try to book the last remaining slot for the same provider at the same minute — exactly one should succeed; the other gets a clear "slot no longer available" error.
- **Payment captured but order creation fails**: the booking transaction must either fully commit (order + payment + slot hold) or fully reverse; no orphan charges.
- **Provider goes offline mid-order**: the order's lifecycle must not silently stall; SLA timers and admin alerts must fire so operations can intervene.
- **Auto-reassignment loop**: the dispatcher attempts at most 3 providers and at most 15 minutes total; thereafter the order terminates in the `unassignable` state with a full automatic refund and an admin alert — never looping indefinitely.
- **Cancellation after the 48-hour review window**: customer attempts to edit a review that is locked — must be rejected with a clear message.
- **Coupon abuse**: the same customer applies a "first-order" coupon by signing up with multiple phone numbers — backend should enforce per-customer caps where defined and surface suspicious patterns for admin review.
- **Concurrent status updates**: customer-facing cancel arrives at the same instant as provider-side "in progress" — exactly one wins, and the resulting state is internally consistent (no order both `in_progress` and `cancelled`).
- **Geographic out-of-service**: a customer requests service from outside the Doha service area — must be rejected at booking creation with a clear reason.
- **Soft delete vs. legal retention**: a customer requests account deletion — personal identifiers must be removable while orders, payments, and tax-relevant records are retained per accounting requirements.

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & identity**

- **FR-001**: System MUST allow registration and login of every principal (customer, provider user, admin user) via **email + one-time code delivered by email**. Codes MUST expire within a short configurable window (default 10 minutes), MUST be single-use, MUST be stored only as a salted hash, and MUST be rate-limited on both issuance (per email and per IP) and verification attempts (lockout after a configurable number of failures). The email address is the verified identity for the account.
- **FR-001a**: System MUST persist a customer's mobile phone number as an **optional contact field** on the user profile (used by providers/technicians to call the customer per PRD §5.1.5); the phone number is NOT an authentication credential.
- **FR-002**: System MUST issue short-lived access tokens and long-lived refresh tokens — issued and signed by SENAM itself (no delegated identity provider) — for all authenticated principals, and MUST support refresh and explicit revocation/logout.
- **FR-003**: System MUST support role-based authorization with at least these roles: `customer`, `provider_owner`, `provider_staff`, `admin`, `super_admin`; every protected endpoint MUST declare the role(s)/permissions required.
- **FR-004**: System MUST support second-factor authentication for admin and provider dashboard logins.

**Customer-side**

- **FR-005**: System MUST allow customers to manage their profile, multiple saved addresses (with geo coordinates), favourite companies, and saved payment methods.
- **FR-006**: System MUST expose a catalog of categories and services, and per-company service offerings with prices, supported areas, and operating hours.
- **FR-007**: System MUST list companies filtered by category and location with sorting by distance, rating, price, and "best match", and MUST return only active/approved companies whose service area covers the customer.
- **FR-008**: System MUST allow customers to create a booking specifying company, service(s), scheduled date/time slot, service address, payment method, and an optional coupon and notes.
- **FR-009**: System MUST model availability as a **fixed grid of time slots per company**: each company configures a slot duration (e.g., 30 or 60 minutes) and a per-slot capacity (number of parallel orders that slot can accept). Customers may only book slots generated from that grid within the company's operating hours. The backend MUST atomically decrement the chosen slot's remaining capacity at booking creation; a slot whose remaining capacity is zero MUST NOT be bookable, and concurrent attempts on the last unit MUST result in exactly one success.
- **FR-010**: System MUST integrate with an external payment provider for card/wallet payments and MUST also support "cash on delivery". For each cash-on-delivery order, the system MUST record a commission-owed accrual against the provider at order completion; that accrual MUST be netted against the provider's next weekly settlement per FR-037.
- **FR-011**: System MUST apply coupon discounts subject to expiry, per-user caps, total caps, scope (category/company), and minimum order amount, and MUST increment usage counters atomically.
- **FR-012**: System MUST allow customers to retrieve their order history grouped by status (current / completed / cancelled), and MUST support "re-order" by cloning a previous booking.
- **FR-013**: System MUST allow customers to cancel an order; cancellation fees and refund amount MUST follow the published policy based on the current status.

**Provider-side**

- **FR-014**: System MUST allow company onboarding with KYC document upload (commercial registration, tax card, owner ID, premises photos, optional certifications and insurance) and MUST keep onboarded companies invisible to customers until an admin approves them.
- **FR-015**: System MUST notify the assigned provider of new orders in real time. If the assigned provider does not accept within 5 minutes, the order MUST be re-offered to the next-best qualifying provider (nearest active provider not previously offered this order). Up to **3 dispatch attempts** are made for any single order, for a combined cap of **15 minutes**. If no provider has accepted at the end of the third attempt, the order MUST transition to `unassignable`, the customer's captured payment MUST be refunded in full, and the case MUST be surfaced on the admin dashboard for manual follow-up. Each provider's individual rejection / no-response counter MUST be incremented per missed attempt.
- **FR-016**: System MUST let providers update an order through the defined lifecycle (`pending` → `accepted` → `on_the_way` → `arrived` → `in_progress` → `completed`, with `cancelled` reachable from accepted-or-earlier per policy); illegal transitions MUST be rejected.
- **FR-017**: System MUST let a CompanyUser with role `owner` manage their company profile, gallery, operating hours and slot templates, service catalog (within admin-imposed price bounds), and the company's roster of `staff` (technician) accounts. The owner MUST be able to assign a specific `staff` user to an order; the assigned staff user MUST be able to advance that order's status from their own session.
- **FR-018**: System MUST give providers a financial view of gross amount, SENAM commission, and net payout per order and per period, plus a view of pending and historical settlements.
- **FR-019**: System MUST let providers reply once to each customer review.

**Admin-side**

- **FR-020**: System MUST let admins approve/reject/suspend/unsuspend companies and review submitted KYC documents.
- **FR-021**: System MUST let admins configure the default commission rate (default 15%) and override it per company within the allowed range (10%–25%).
- **FR-022**: System MUST let admins intervene on any order: force-cancel, issue full or partial refund, and reassign — all with audit trail capturing actor, reason, before/after state, and timestamp.
- **FR-023**: System MUST let admins manage categories, services, price bands, banner content, and promotional coupons.
- **FR-024**: System MUST let admins manage internal users with roles & permissions and MUST log every privileged action to an immutable audit log.
- **FR-025**: System MUST expose reports covering: sales (daily/weekly/monthly), performance per category, customer acquisition/retention, top providers, and commission earned — with date-range filtering and export.

**Reviews & notifications**

- **FR-026**: System MUST accept customer reviews only for completed orders, MUST capture separate ratings (overall company, technician, speed, quality) plus an optional comment and photos, and MUST lock reviews from edits 48 hours after submission.
- **FR-027**: System MUST recompute a company's aggregate rating after each review event.
- **FR-028**: System MUST send push notifications and in-app notifications for: order status changes, provider replies, promotions, and booking reminders, and MUST persist the notification history per user.

**Cross-cutting**

- **FR-029**: System MUST publish a machine-readable API description (OpenAPI/Swagger) covering every public endpoint, including auth requirements, request/response schemas, and error codes; this description MUST be browsable through an interactive UI in non-production environments.
- **FR-030**: System MUST emit real-time events to subscribed clients for order status changes and provider chat messages, with delivery latency targets defined under Success Criteria.
- **FR-031**: System MUST enforce input validation, rate limiting, and abuse protection (brute-force on OTP, repeated failed logins, abnormal coupon usage) at the API edge.
- **FR-032**: System MUST log structured request/response and domain events with correlation IDs sufficient for tracing a single user action across services and for incident post-mortems.
- **FR-033**: System MUST support automated daily backups of the primary data store with a documented restore procedure.
- **FR-034**: System MUST behave correctly under right-to-left Arabic content for every user-facing text field (names, addresses, notes, reviews) — store, search, and return Arabic content losslessly.
- **FR-035**: System MUST localise error messages and notification text to Arabic for the MVP, with the schema flexible enough to add English values in a later phase without a breaking change.
- **FR-036**: System MUST honour customer account deletion by removing/anonymising personal identifiers while retaining financial/transactional records as required for accounting and dispute resolution.
- **FR-037**: System MUST run a weekly settlement computation per company producing an immutable settlement record per window. The settlement amount per company per window = (sum of completed online-paid order gross − SENAM commission on those orders − refunds processed in the window) − (sum of SENAM commission accrued on cash-on-delivery orders completed in the window) − (any prior-window negative balance carried forward). A settlement MAY be negative, in which case it is marked `provider_owes` and carried forward to the next window, and an admin review flag MUST be raised when the carried-forward balance exceeds a configurable threshold.
- **FR-038**: System MUST limit operations to the configured service area (Doha for the MVP) and reject booking creation for addresses outside it.

### Key Entities *(include if feature involves data)*

- **User**: an end customer. Holds verified email (the identity credential), profile (name), optional mobile phone (contact only), preferred language, addresses, favourites, saved payment tokens (provider-side references, not raw card data), and lifecycle flags (active, deleted, banned).
- **Company**: a service provider. Holds business identity, KYC documents and verification status, category coverage, service area polygons, operating hours, gallery, aggregate rating, commission override, and operational status (pending / active / suspended).
- **CompanyUser**: a person authorised to act for a Company; has an individual email-OTP login and one of the roles `owner` or `staff`. A **technician** is a CompanyUser with role `staff` — they can be assigned orders, update order status through the lifecycle, and carry their own aggregate rating and completed-order count. The role `owner` adds the ability to manage company profile, services, slot templates, and the staff roster.
- **Category & Service**: hierarchical service catalog; a Service belongs to a Category and is offered by a Company at a specific price (`CompanyService`).
- **Order**: a customer booking — customer, company, list of services, scheduled time slot, service address, totals, applied coupon, payment reference, current status, assigned technician, and a derived `OrderStatusHistory` of every transition.
- **TimeSlot / SlotTemplate**: a company's availability is generated from a `SlotTemplate` (slot duration, per-slot capacity, operating-hour windows, weekday overrides, blackout dates). Concrete `TimeSlot` rows are derived per date with remaining-capacity counters that are atomically decremented when an Order is created and incremented when it is cancelled within policy.
- **Payment / Refund**: a financial event tied to an Order — gateway reference, amount, currency, captured/authorised state, and any refunds with their reasons.
- **Coupon & CouponUsage**: a discount rule and its per-customer/per-order usages, with concurrency-safe counters.
- **Review & ReviewReply**: a customer's rating of a completed order and the company's single allowed reply.
- **Notification**: a message addressed to a specific user across one or more channels (push, in-app, optionally email/SMS), with delivery state.
- **Address**: a reusable geocoded location belonging to a User, with label, raw text, coordinates, and any access notes.
- **Commission & Settlement**: the rate applied to a company (default 15%, overridable 10–25% per company) and the weekly aggregated payout record across that company's completed orders. A `CommissionAccrual` row is created for every completed order — debited from the provider's settlement if the order was paid online, added as a separate debit if the order was paid cash. A `Settlement` may be positive (SENAM pays the provider) or negative (provider owes SENAM), and a negative balance carries forward into the next window's opening balance.
- **AuditLog**: append-only record of privileged admin actions with actor, action, target entity, before/after state, reason, and timestamp.
- **AdminUser / Role / Permission**: internal user accounts and the RBAC catalogue that gates administrative endpoints.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new customer can go from "open app for the first time" to "first booking confirmed" in under 90 seconds when the backend is the only dependency under test (i.e., excluding human time outside the API path) — aligning with the PRD's 90-second UX target.
- **SC-002**: 95% of API responses across the customer-facing booking, listing, and order endpoints return within 300 ms (P95), and 99% within 800 ms, under a sustained load of 10,000 concurrent active users.
- **SC-003**: The platform sustains 99.9% monthly availability for customer-facing endpoints measured externally.
- **SC-004**: Order status updates published by the provider reach the customer's subscribed client within 2 seconds for the 95th percentile.
- **SC-005**: Time-slot double-booking, duplicate-charge, and coupon over-redemption defects are zero in load tests that simulate at least 100× concurrent contention on the same resource.
- **SC-006**: 100% of public endpoints are described in the published OpenAPI document, and every documented endpoint passes a contract test against the running service in CI.
- **SC-007**: A full database backup can be restored into a fresh environment within 1 hour, and the restore procedure is exercised at least quarterly.
- **SC-008**: An admin can pull a sales report for any date range up to 12 months in under 5 seconds.
- **SC-009**: 100% of orders whose initial provider does not accept within 5 minutes either (a) reach an `accepted` state via auto-reassignment within at most 3 attempts and a combined 15 minutes, or (b) terminate in `unassignable` with a full refund issued and an admin alert raised — with no order remaining in dispatch for more than 15 minutes.
- **SC-010**: Operational support can locate, from a single customer-reported issue, every related event (order, payment, status changes, notifications, admin actions) via a correlation ID in under 2 minutes.

## Assumptions

- **Tech-stack constraints (pre-decided by the user)**: the implementation will use a NestJS-based service exposing OpenAPI/Swagger documentation and backed by PostgreSQL. These choices are honoured but are not the subject of this spec — concrete library, schema, and module decisions belong to `/speckit.plan`.
- **Inputs of record**: this spec derives its scope primarily from `screenshot/SENAM_PRD.md` (the SENAM v1.0 PRD) and references the Flutter client skeleton in `senam_app/` only to confirm the client surface. Where the PRD and the request disagree, the PRD wins for MVP scope.
- **MVP scope per PRD §4.1**: car-wash vertical only, Doha geographic scope only, Arabic UI/content only. Categories and services for other verticals (haircut, cleaning, maintenance, etc.) are out of MVP scope but MUST be representable in the data model so they can be turned on later without a schema break.
- **OTP delivery**: email-based OTP is delivered by an external transactional-email provider (e.g., SendGrid, Amazon SES, or Postmark). The backend integrates with one provider behind a port/adapter interface; concrete provider selection is a planning decision. This diverges deliberately from PRD §5.1.1 / §10.1 / §11 (which specified phone+SMS OTP via Firebase Auth or Twilio) — see Clarifications session 2026-05-20.
- **Payment gateway**: a single Qatar-supported gateway (e.g., MyFatoorah or Tap per PRD §11) is integrated for MVP. Apple Pay/Google Pay/cards are routed through that gateway; raw card data is never stored.
- **File storage**: user-uploaded images (company gallery, KYC documents, review photos) live in an external object store (e.g., S3/R2 per PRD §10.1). The backend stores only references and signed-URL metadata.
- **Real-time delivery**: real-time order updates are delivered through a server-push channel (WebSocket or equivalent). Provider-side dashboards and the mobile client subscribe; polling is allowed as a fallback for clients that cannot maintain a persistent connection.
- **Time zone & locale**: all timestamps are stored in UTC; display conversion is the client's responsibility. The default operating time zone for business-day boundaries (e.g., the "Sunday weekly settlement") is Asia/Qatar.
- **Currency**: monetary values are stored as integer minor units in Qatari Riyal (QAR) for MVP; multi-currency is out of scope.
- **PII & compliance**: KYC and PII are stored encrypted at rest; payment card data is never persisted on SENAM infrastructure (PCI scope reduced via gateway tokenisation).
- **Reporting freshness**: admin reports can run against the operational store directly for MVP volumes (sub-10k orders/month per PRD §2.1). A separate analytics warehouse is out of scope but the data model must not block one later.
- **Out of scope for this spec**: the Flutter customer app itself, the web admin and provider dashboards, the marketing site, mobile push notification UI, the loyalty/wallet/referral systems (PRD Phase 2+), and the English localisation.
