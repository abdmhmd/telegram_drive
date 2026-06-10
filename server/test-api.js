import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Configuration ───────────────────────────────────────────────────────────
const HOSTS = [
  { name: 'local',      url: 'http://localhost:3001' },
  { name: 'deployed',   url: 'https://tele-drive.pxxl.click' },
];

const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const TEST_PHONE = process.env.TEST_PHONE || '+1234567890';
const API_ID = process.env.API_ID || '12345';
const API_HASH = process.env.API_HASH || 'abc123def456';

const RESULTS_FILE = path.join(__dirname, 'test-results.json');
const TIMEOUT_MS = 15000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results = [];

function log(hostName, method, path, status, expected, timeMs, ok, body) {
  const entry = {
    host: hostName,
    method,
    path,
    expectedStatus: expected,
    actualStatus: status,
    timeMs,
    ok,
    responseSnippet: typeof body === 'string'
      ? body.slice(0, 200)
      : JSON.stringify(body).slice(0, 200),
  };
  results.push(entry);

  const icon = ok ? '✓' : '✗';
  const color = ok ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${icon} ${method} ${path} [${status}] ${timeMs}ms\x1b[0m`);
  if (!ok) {
    console.log(`   expected ${expected}, got ${status}`);
    console.log(`   body: ${JSON.stringify(body).slice(0, 300)}`);
  }
  if (ok) passed++; else failed++;
}

async function request(host, method, path, opts = {}) {
  const url = `${host.url}${path}`;
  const headers = { ...opts.headers };
  if (opts.token) {
    headers['Authorization'] = `Bearer ${opts.token}`;
  }
  if (opts.formData) {
    // do not set Content-Type — fetch sets it with boundary
  } else if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const start = Date.now();
  let status, body;
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: opts.body || undefined,
      signal: AbortSignal.timeout(opts.timeout || TIMEOUT_MS),
    });
    status = res.status;
    const text = await res.text();
    try { body = JSON.parse(text); } catch { body = text; }
  } catch (err) {
    status = 0;
    body = { error: err.message || 'Network error' };
  }
  const timeMs = Date.now() - start;
  return { status, body, timeMs };
}

function expect(expected, actual) {
  if (Array.isArray(expected)) return expected.includes(actual);
  return expected === actual;
}

// ─── Test Suites ─────────────────────────────────────────────────────────────

async function testSuite(name, host, opts) {
  console.log(`\n═══════════════════════════════════════════`);
  console.log(`  ${name} — ${host.name} (${host.url})`);
  console.log(`═══════════════════════════════════════════\n`);

  // 1. Health check
  {
    const r = await request(host, 'GET', '/api/health');
    log(host.name, 'GET', '/api/health', r.status, 200, r.timeMs,
      r.status === 200 && r.body?.status === 'ok', r.body);
  }

  // 2. Auth — send-code (missing fields → 400)
  {
    const r = await request(host, 'POST', '/api/auth/send-code', {
      body: JSON.stringify({}),
    });
    log(host.name, 'POST', '/api/auth/send-code (missing fields)', r.status, 400, r.timeMs,
      r.status === 400, r.body);
  }

  // 3. Auth — send-code (invalid but structured → 400 for bad API_ID)
  {
    const r = await request(host, 'POST', '/api/auth/send-code', {
      body: JSON.stringify({ api_id: API_ID, api_hash: API_HASH, phone: TEST_PHONE }),
      timeout: 8000,
    });
    // May get 400 or 200 depending on whether Telegram rejects the API_ID
    const ok = r.status === 400 || r.status === 200;
    log(host.name, 'POST', '/api/auth/send-code (credentials test)', r.status, [400, 200], r.timeMs, ok, r.body);
  }

  // 4. Auth — verify-code (missing fields → 400)
  {
    const r = await request(host, 'POST', '/api/auth/verify-code', {
      body: JSON.stringify({}),
    });
    log(host.name, 'POST', '/api/auth/verify-code (missing fields)', r.status, 400, r.timeMs,
      r.status === 400, r.body);
  }

  // 5. Auth — verify-2fa (missing fields → 400)
  {
    const r = await request(host, 'POST', '/api/auth/verify-2fa', {
      body: JSON.stringify({}),
    });
    log(host.name, 'POST', '/api/auth/verify-2fa (missing fields)', r.status, 400, r.timeMs,
      r.status === 400, r.body);
  }

  // 6. Auth — login (missing fields → 400)
  {
    const r = await request(host, 'POST', '/api/auth/login', {
      body: JSON.stringify({}),
    });
    log(host.name, 'POST', '/api/auth/login (missing fields)', r.status, 400, r.timeMs,
      r.status === 400, r.body);
  }

  // 7. Auth — accounts
  {
    const r = await request(host, 'GET', '/api/auth/accounts');
    log(host.name, 'GET', '/api/auth/accounts', r.status, 200, r.timeMs,
      r.status === 200 && Array.isArray(r.body?.accounts), r.body);
  }

  // ─── Authenticated endpoints ───────────────────────────────────────────
  const token = opts?.token || AUTH_TOKEN;
  const authed = !!token;

  // 8. Files — list without auth (401)
  {
    const r = await request(host, 'GET', '/api/files');
    log(host.name, 'GET', '/api/files (no auth)', r.status, 401, r.timeMs,
      r.status === 401, r.body);
  }

  if (authed) {
    // 9. Files — list (authorized)
    {
      const r = await request(host, 'GET', '/api/files', { token });
      log(host.name, 'GET', '/api/files', r.status, 200, r.timeMs,
        r.status === 200 && Array.isArray(r.body?.items), r.body);
    }

    // 10. Files — list with parent_id
    {
      const r = await request(host, 'GET', '/api/files?parent_id=root', { token });
      log(host.name, 'GET', '/api/files?parent_id=root', r.status, 200, r.timeMs,
        r.status === 200, r.body);
    }

    // 11. Files — upload without file (400)
    {
      const r = await request(host, 'POST', '/api/files/upload', {
        token,
        headers: {},
        body: 'this is not multipart',
      });
      log(host.name, 'POST', '/api/files/upload (no file)', r.status, 400, r.timeMs,
        r.status === 400, r.body);
    }

    // 12. Folders — create without name (400)
    {
      const r = await request(host, 'POST', '/api/folders', {
        token,
        body: JSON.stringify({}),
      });
      log(host.name, 'POST', '/api/folders (no name)', r.status, 400, r.timeMs,
        r.status === 400, r.body);
    }

    // 13. Folders — create (valid request)
    {
      const r = await request(host, 'POST', '/api/folders', {
        token,
        body: JSON.stringify({ name: 'Test Folder ' + Date.now() }),
      });
      log(host.name, 'POST', '/api/folders', r.status, 201, r.timeMs,
        r.status === 201 && r.body?.item?.is_folder === 1, r.body);
    }

    // 14. File — get nonexistent item (404)
    {
      const r = await request(host, 'GET', '/api/files/preview/99999999', { token });
      log(host.name, 'GET', '/api/files/preview/99999999 (not found)', r.status, 404, r.timeMs,
        r.status === 404, r.body);
    }

    // 15. File — download nonexistent (404)
    {
      const r = await request(host, 'GET', '/api/files/download/99999999', { token });
      log(host.name, 'GET', '/api/files/download/99999999 (not found)', r.status, 404, r.timeMs,
        r.status === 404, r.body);
    }

    // 16. File — delete nonexistent (404)
    {
      const r = await request(host, 'DELETE', '/api/files/99999999', { token });
      log(host.name, 'DELETE', '/api/files/99999999 (not found)', r.status, 404, r.timeMs,
        r.status === 404, r.body);
    }

    // 17. File — update nonexistent (404)
    {
      const r = await request(host, 'PUT', '/api/files/99999999', {
        token,
        body: JSON.stringify({ name: 'renamed' }),
      });
      log(host.name, 'PUT', '/api/files/99999999 (not found)', r.status, 404, r.timeMs,
        r.status === 404, r.body);
    }

    // 18. File — share nonexistent (404)
    {
      const r = await request(host, 'POST', '/api/files/99999999/share', {
        token,
        body: JSON.stringify({}),
      });
      log(host.name, 'POST', '/api/files/99999999/share (not found)', r.status, 404, r.timeMs,
        r.status === 404, r.body);
    }

    // 19. Semantic search (likely 404 — missing backend endpoint)
    {
      const r = await request(host, 'GET', '/api/files/semantic-search?q=test', { token });
      // Expect 200 or 404 depending on whether backend implements it
      log(host.name, 'GET', '/api/files/semantic-search?q=test', r.status, [200, 404], r.timeMs,
        r.status === 200 || r.status === 404, r.body);
    }
  } else {
    console.log('\n\x1b[33m⚠ Skipping authenticated tests — set AUTH_TOKEN env var\x1b[0m');
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

const opts = { token: AUTH_TOKEN };

console.log(`\x1b[1mTelegram Drive — API Test Suite\x1b[0m`);
console.log(`Auth token: ${AUTH_TOKEN ? 'provided' : 'NOT provided (auth tests skipped)'}`);
console.log(`Test phone: ${TEST_PHONE}`);
console.log(`\nTesting ${HOSTS.length} host(s)...`);

for (const host of HOSTS) {
  await testSuite('API Tests', host, opts);
}

// ─── Report ──────────────────────────────────────────────────────────────────

const summary = { total: passed + failed, passed, failed };
results.push({ _summary: summary });

fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

console.log(`\n═══════════════════════════════════════════`);
console.log(`  RESULTS SAVED TO: ${RESULTS_FILE}`);
console.log(`  TOTAL: ${summary.total}  |  PASSED: ${summary.passed}  |  FAILED: ${summary.failed}`);
console.log(`═══════════════════════════════════════════\n`);

process.exit(failed > 0 ? 1 : 0);
