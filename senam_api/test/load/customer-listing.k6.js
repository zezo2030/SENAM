/**
 * T099 — Load test: customer listing endpoints
 *
 * Targets:
 *   GET /v1/companies?sort=nearest  (nearest-company listing)
 *   GET /v1/companies/:id/services  (company service catalog)
 *
 * SLOs (SC-002):
 *   P95 < 300 ms, P99 < 800 ms
 *   Error rate < 1 %
 *
 * Run:
 *   k6 run test/load/customer-listing.k6.js \
 *     -e BASE_URL=http://localhost:3000 \
 *     -e AUTH_TOKEN=<bearer-token>
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// ─── Custom metrics ──────────────────────────────────────────────────────────
const listLatency = new Trend('listing_latency', true);
const servicesLatency = new Trend('services_latency', true);
const errorRate = new Rate('error_rate');

// ─── Test configuration ───────────────────────────────────────────────────────
export const options = {
  scenarios: {
    sustained_load: {
      executor: 'constant-vus',
      vus: 10000,
      duration: '10m',
      gracefulStop: '30s',
    },
  },
  thresholds: {
    listing_latency: ['p(95)<300', 'p(99)<800'],
    services_latency: ['p(95)<300', 'p(99)<800'],
    error_rate: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Doha bounding box: lat 25.18–25.40, lng 51.40–51.65
function randomDohaCoords() {
  const lat = (25.18 + Math.random() * 0.22).toFixed(6);
  const lng = (51.40 + Math.random() * 0.25).toFixed(6);
  return { lat, lng };
}

function authHeaders() {
  return {
    Authorization: `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

// ─── VU workload ──────────────────────────────────────────────────────────────
export default function () {
  const { lat, lng } = randomDohaCoords();
  const headers = authHeaders();

  // ── Step 1: nearest-company listing ─────────────────────────────────────
  const listRes = http.get(
    `${BASE_URL}/v1/companies?sort=nearest&lat=${lat}&lng=${lng}&limit=20`,
    { headers, tags: { name: 'list_companies' } },
  );

  const listOk = check(listRes, {
    'list_companies: status 200': (r) => r.status === 200,
    'list_companies: body is JSON': (r) => {
      try { JSON.parse(r.body); return true; } catch { return false; }
    },
  });

  listLatency.add(listRes.timings.duration);
  errorRate.add(!listOk);

  if (!listOk) {
    sleep(0.5);
    return;
  }

  // ── Step 2: services for one company from the list ───────────────────────
  let companyId = null;
  try {
    const body = JSON.parse(listRes.body);
    const companies = Array.isArray(body) ? body : (body.data ?? []);
    if (companies.length > 0) {
      const idx = Math.floor(Math.random() * Math.min(companies.length, 5));
      companyId = companies[idx]?.id ?? companies[idx]?.companyId;
    }
  } catch (_) {}

  if (companyId) {
    const svcRes = http.get(
      `${BASE_URL}/v1/companies/${companyId}/services`,
      { headers, tags: { name: 'company_services' } },
    );

    const svcOk = check(svcRes, {
      'company_services: status 200': (r) => r.status === 200,
    });

    servicesLatency.add(svcRes.timings.duration);
    errorRate.add(!svcOk);
  }

  // 100 ms think-time mimics a human paging through results
  sleep(0.1);
}

// ─── Lifecycle hooks ──────────────────────────────────────────────────────────
export function handleSummary(data) {
  const p95List = data.metrics.listing_latency?.values?.['p(95)'] ?? 'N/A';
  const p99List = data.metrics.listing_latency?.values?.['p(99)'] ?? 'N/A';
  const p95Svc = data.metrics.services_latency?.values?.['p(95)'] ?? 'N/A';
  const p99Svc = data.metrics.services_latency?.values?.['p(99)'] ?? 'N/A';
  const errRate = (data.metrics.error_rate?.values?.rate * 100 ?? 0).toFixed(2);

  console.log(`
=== Load Test Summary: Customer Listing (SC-002) ===
  listing_latency  P95=${p95List}ms  P99=${p99List}ms  (target P95<300 P99<800)
  services_latency P95=${p95Svc}ms  P99=${p99Svc}ms  (target P95<300 P99<800)
  error_rate: ${errRate}%  (target <1%)
`);

  return {
    'test/load/results/customer-listing-summary.json': JSON.stringify(data, null, 2),
  };
}
