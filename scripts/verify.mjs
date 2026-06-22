// scripts/verify.mjs
//
// The verify gate is a wall of DETERMINISTIC checks (same inputs -> same verdict,
// every run, on every machine) that bounds the one NONDETERMINISTIC surface inside
// it (browser e2e) and, ultimately, the truly nondeterministic thing it exists to
// contain: an agent's generated code. That determinism is what makes an agent's
// work trustable enough to merge without a human reading every line.
import { execSync } from 'node:child_process';

const TEST_DATABASE_URL =
  'postgresql://postgres:postgres@localhost:55433/trello_clone_test';
const isCI = Boolean(process.env.CI);

function run(cmd, extraEnv = {}) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...extraEnv } });
}

const dbEnv = { DATABASE_URL: TEST_DATABASE_URL };
// JWT secrets required by server — test-only placeholder values.
const jwtEnv = {
  JWT_SECRET: 'test-jwt-secret-for-verify',
  JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-for-verify',
};
const testEnv = { ...dbEnv, ...jwtEnv, NODE_ENV: 'test' };
// e2e boots the real server (must listen), so NOT NODE_ENV=test; CI flag makes
// Playwright start a fresh server instead of reusing one.
// CLIENT_URL must match the Vite origin so the server's CORS whitelist accepts it.
// VITE_API_URL is injected so client/.env is not required for a hermetic run.
const e2eEnv = {
  ...dbEnv,
  ...jwtEnv,
  NODE_ENV: 'e2e',
  CI: 'true',
  CLIENT_URL: 'http://localhost:5173',
  VITE_API_URL: 'http://localhost:4000/api',
};

try {
  // [DETERMINISTIC] static analysis + unit/integration: pure functions of the
  // source + a fresh, identical DB state, so the verdict is repeatable.
  run('npm run lint');
  run('npm run format:check');
  if (!isCI) run('npm run db:up'); // fresh ephemeral DB = deterministic starting state
  run('npm run migrate:test', dbEnv);
  run('npm run test:server', testEnv);
  run('npm run test:client');
  run('npm run build:client');
  run('npm --prefix e2e exec -- playwright install --with-deps chromium');
  // [NONDETERMINISTIC] browser e2e: real servers, real timing, the network — the
  // one flaky-prone surface in the gate. Pulled back toward determinism by a fresh
  // DB, serial execution (workers:1) and CI retries (see e2e/playwright.config.ts).
  // Free the e2e server ports before Playwright starts its own (CI=true disallows reuse).
  try {
    execSync('lsof -ti :4000 | xargs kill -9', { stdio: 'ignore' });
  } catch {
    /* nothing on port */
  }
  try {
    execSync('lsof -ti :5173 | xargs kill -9', { stdio: 'ignore' });
  } catch {
    /* nothing on port */
  }
  run('npm run test:e2e', e2eEnv);
  console.log('\n✅ verify passed');
} finally {
  if (!isCI) {
    try {
      run('npm run db:down');
    } catch {
      console.error('warning: db teardown failed');
    }
  }
}
