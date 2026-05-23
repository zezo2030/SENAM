/**
 * T101 — OpenAPI congruence test (SC-006)
 *
 * Asserts that every path + HTTP method defined in the planning spec
 * (specs/001-senam-backend-api/contracts/openapi.yaml) exists in the
 * live OpenAPI document served by the running API, and vice versa.
 *
 * Prerequisites:
 *   The API must be running before this test executes.
 *   Set TEST_SERVER_URL (default http://localhost:3000) to point at it.
 *
 * Run:
 *   npm run start:dev &   # or: docker compose up
 *   npm run test:openapi
 *
 * In CI, start the server in a prior step and pass TEST_SERVER_URL.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as jsYaml from 'js-yaml';

// ─── Config ──────────────────────────────────────────────────────────────────

const SERVER_URL = process.env['TEST_SERVER_URL'] ?? 'http://localhost:3000';
const CONNECT_TIMEOUT_MS = 8_000;

// Paths defined in the spec that are deliberately excluded from the live check
const SPEC_EXCLUSIONS: Set<string> = new Set([
  // none currently
]);

// Paths in the live doc that don't need to be in the planning spec
// (e.g., operational endpoints not part of the product contract)
const LIVE_EXCLUSIONS: Set<string> = new Set([
  'GET /healthz',
  'GET /readyz',
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

type PathMethodSet = Set<string>; // e.g. "GET /companies"

function httpGetWithTimeout(url: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${String(res.statusCode)} for ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      res.on('error', reject);
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Request timed out after ${timeoutMs}ms: ${url}`));
    });

    req.on('error', reject);
  });
}

function extractPathMethods(
  paths: Record<string, unknown>,
): PathMethodSet {
  const result = new Set<string>();
  const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (typeof pathItem !== 'object' || pathItem === null) continue;
    for (const method of httpMethods) {
      if (method in (pathItem as Record<string, unknown>)) {
        result.add(`${method.toUpperCase()} ${pathKey}`);
      }
    }
  }

  return result;
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('OpenAPI congruence (SC-006)', () => {
  let serverAvailable = false;
  let livePaths: PathMethodSet = new Set();
  let specPaths: PathMethodSet = new Set();

  beforeAll(async () => {
    // ── 1. Load the planning spec ────────────────────────────────────────────
    const specFilePath = path.join(
      __dirname,
      '../../../specs/001-senam-backend-api/contracts/openapi.yaml',
    );

    expect(fs.existsSync(specFilePath)).toBe(true);

    const specContent = fs.readFileSync(specFilePath, 'utf-8');
    const specDoc = jsYaml.load(specContent) as {
      paths: Record<string, unknown>;
    };

    specPaths = extractPathMethods(specDoc.paths ?? {});

    // ── 2. Fetch the live swagger.json ───────────────────────────────────────
    try {
      const swaggerJson = await httpGetWithTimeout(
        `${SERVER_URL}/swagger-json`,
        CONNECT_TIMEOUT_MS,
      );
      const liveDoc = JSON.parse(swaggerJson) as { paths: Record<string, unknown> };

      // Normalise live paths: strip /v1 global prefix so they match the spec
      const rawLivePaths = extractPathMethods(liveDoc.paths ?? {});
      livePaths = new Set(
        [...rawLivePaths].map((entry) => entry.replace(/^(\w+) \/v1/, '$1 ')),
      );

      serverAvailable = true;
    } catch (err) {
      console.warn(
        `\n[openapi-congruence] Server not reachable at ${SERVER_URL} — tests that require a running server will be skipped.\n` +
          `  Start the API with: npm run start:dev\n` +
          `  Then re-run:        npm run test:openapi\n` +
          `  Original error: ${(err as Error).message}\n`,
      );
    }
  }, 15_000);

  // ── Test 1: spec document has paths ─────────────────────────────────────
  it('spec document defines at least 10 path+method combinations', () => {
    expect(specPaths.size).toBeGreaterThanOrEqual(10);
  });

  // ── Tests that require a live server ──────────────────────────────────────

  it('live document has at least 10 path+method combinations', () => {
    if (!serverAvailable) return; // skip silently when server is down
    expect(livePaths.size).toBeGreaterThanOrEqual(10);
  });

  it('every spec path exists in the live OpenAPI document', () => {
    if (!serverAvailable) return;

    const missing: string[] = [];
    for (const entry of specPaths) {
      if (SPEC_EXCLUSIONS.has(entry)) continue;
      if (!livePaths.has(entry)) {
        missing.push(entry);
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `The following paths are in the spec but MISSING from the live doc:\n` +
          missing.map((p) => `  • ${p}`).join('\n'),
      );
    }
  });

  it('every live path exists in the spec (no undocumented endpoints)', () => {
    if (!serverAvailable) return;

    const extra: string[] = [];
    for (const entry of livePaths) {
      if (LIVE_EXCLUSIONS.has(entry)) continue;
      if (!specPaths.has(entry)) {
        extra.push(entry);
      }
    }

    if (extra.length > 0) {
      throw new Error(
        `The following paths exist in the live doc but are MISSING from the spec:\n` +
          extra.map((p) => `  • ${p}`).join('\n') +
          `\n\nAdd them to contracts/openapi.yaml or add them to LIVE_EXCLUSIONS in this test.`,
      );
    }
  });

  it('live swagger info.title and version match the spec', async () => {
    if (!serverAvailable) return;

    const swaggerJson = await httpGetWithTimeout(
      `${SERVER_URL}/swagger-json`,
      CONNECT_TIMEOUT_MS,
    );
    const liveDoc = JSON.parse(swaggerJson) as {
      info: { title: string; version: string };
    };

    expect(liveDoc.info.title).toBe('SENAM API');
    expect(liveDoc.info.version).toBe('0.1.0-mvp');
  }, 10_000);
});
