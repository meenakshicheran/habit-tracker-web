/**
 * HabitFlow Load Test
 *
 * Run:
 *   k6 run load-test.js \
 *     -e BASE_URL=http://localhost:3000 \
 *     -e TEST_EMAIL=test@example.com \
 *     -e TEST_PASSWORD=password123
 *
 * Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
 * Results give you p95 latency numbers to quote in interviews.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const summaryDuration = new Trend('summary_duration', true);
const heatmapDuration = new Trend('heatmap_duration', true);

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // ramp up
    { duration: '1m',  target: 50 },  // hold at 50 concurrent users
    { duration: '30s', target: 0  },  // ramp down
  ],
  thresholds: {
    'http_req_duration{name:summary}': ['p(95)<500'],
    'http_req_duration{name:heatmap}': ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  // Step 1: get CSRF token (required by NextAuth)
  const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`);
  const csrfToken = JSON.parse(csrfRes.body).csrfToken;

  if (!csrfToken) throw new Error('Could not get CSRF token');

  // Step 2: sign in with email/password
  const signInRes = http.post(
    `${BASE_URL}/api/auth/callback/credentials`,
    {
      csrfToken,
      email: __ENV.TEST_EMAIL || 'test@example.com',
      password: __ENV.TEST_PASSWORD || 'password123',
      callbackUrl: `${BASE_URL}/dashboard`,
      json: 'true',
    },
    { redirects: 0 }
  );

  const sessionCookie = signInRes.cookies['next-auth.session-token']?.[0]?.value;
  if (!sessionCookie) {
    throw new Error(
      'Login failed — no session cookie. Register a test account first:\n' +
      `  curl -X POST ${BASE_URL}/api/auth/register -H 'Content-Type: application/json' ` +
      `-d '{"name":"Test","email":"${__ENV.TEST_EMAIL}","password":"${__ENV.TEST_PASSWORD}"}'`
    );
  }

  return { sessionCookie };
}

export default function loadTest(data) {
  const params = {
    headers: { Cookie: `next-auth.session-token=${data.sessionCookie}` },
  };

  // --- /api/dashboard/summary ---
  const summaryRes = http.get(`${BASE_URL}/api/dashboard/summary`, {
    ...params,
    tags: { name: 'summary' },
  });
  check(summaryRes, {
    'summary 200':       (r) => r.status === 200,
    'summary has stats': (r) => JSON.parse(r.body).stats !== undefined,
  });
  summaryDuration.add(summaryRes.timings.duration);

  sleep(0.5);

  // --- /api/dashboard/heatmap ---
  const heatmapRes = http.get(`${BASE_URL}/api/dashboard/heatmap`, {
    ...params,
    tags: { name: 'heatmap' },
  });
  check(heatmapRes, {
    'heatmap 200':         (r) => r.status === 200,
    'heatmap 365 days':    (r) => JSON.parse(r.body).days?.length === 365,
  });
  heatmapDuration.add(heatmapRes.timings.duration);

  sleep(1);
}
