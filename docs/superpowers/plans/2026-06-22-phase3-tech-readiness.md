# Phase 3 Tech-Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make this repository safe and reproducible for an autonomous coding agent to clone into an ephemeral devbox, work natively, and verify its own changes hermetically with one command and in CI — the *Tech & tooling* dimension of Phase 3 ("async autonomous execution").

**Architecture:** Keep the repo as a plain native-harness codebase (no MCP wrapper). Add a code-enforced test-database guard, an ephemeral Postgres container, a single root `verify` orchestrator that runs the full test pyramid against the throwaway DB, a reproducible devbox image, lint/format/coverage gates, and a CI workflow that runs the same `verify`. Safety lives in code and at the perimeter, never by narrowing the agent's tools.

**Tech Stack:** Node 20 (ESM), Express, Prisma, PostgreSQL 16, React/Vite, Jest (server), Vitest (client), Playwright (e2e), Docker Compose, GitHub Actions, ESLint 9 (flat config), Prettier.

## Global Constraints

- **Repo root** for all new top-level files is the git root: `trello-clone-practice-task/`. All paths below are relative to it.
- **JavaScript only** for server and client — do NOT introduce TypeScript (per `CLAUDE.md`). e2e stays TypeScript.
- **No repo MCP.** Do not wrap the codebase behind an MCP server. The agent uses the native shell/fs/git harness.
- **Ephemeral test database** named `trello_clone_test`, served on host port **5433** (to never collide with a developer's dev Postgres on 5432). Canonical URL: `postgresql://postgres:postgres@localhost:5433/trello_clone_test`.
- **Server is ESM**; Jest runs via `node --experimental-vm-modules`. `app.listen` in `server/src/index.js:41` is already guarded by `NODE_ENV !== 'test'` — preserve that.
- **dotenv does not override already-set env vars**, so passing `DATABASE_URL`/`NODE_ENV` through `process.env` to a `npm run dev` subprocess wins over `server/.env`. Rely on this for hermetic runs.
- **Conventional commits**, one commit per task.
- **No absolute prod credentials** anywhere in the repo or devbox. Test/dev creds only.

---

### Task 1: Code-enforced test-database safety guard

The single most dangerous thing in the repo today: `server/src/__tests__/setup.js:94` runs `cleanDatabase()` (truncates every table) in `beforeEach`, guarded only by a prose warning in `CLAUDE.md`. An autonomous `npm test` against the dev DB wipes it. Move the guard into code.

**Files:**
- Create: `server/src/lib/assertTestDatabase.js`
- Create: `server/src/__tests__/assertTestDatabase.test.js`
- Modify: `server/src/__tests__/setup.js` (add guard call near top)

**Interfaces:**
- Produces: `assertTestDatabase(env = process.env) -> { dbName: string }` — throws `Error` if `env.NODE_ENV !== 'test'`, if `DATABASE_URL` is missing/invalid, or if the database name does not contain `test` (case-insensitive). Returns `{ dbName }` on success.

- [ ] **Step 1: Write the failing test**

```js
// server/src/__tests__/assertTestDatabase.test.js
import { assertTestDatabase } from '../lib/assertTestDatabase.js';

const TEST_URL = 'postgresql://postgres:postgres@localhost:5433/trello_clone_test';
const PROD_URL = 'postgresql://postgres:postgres@localhost:5432/trello_clone';

describe('assertTestDatabase', () => {
  test('throws when DATABASE_URL is missing', () => {
    expect(() => assertTestDatabase({ NODE_ENV: 'test' })).toThrow(/DATABASE_URL is not set/);
  });

  test('throws when NODE_ENV is not "test"', () => {
    expect(() => assertTestDatabase({ NODE_ENV: 'development', DATABASE_URL: TEST_URL }))
      .toThrow(/Refusing to run destructive tests/);
  });

  test('throws when the database name does not contain "test"', () => {
    expect(() => assertTestDatabase({ NODE_ENV: 'test', DATABASE_URL: PROD_URL }))
      .toThrow(/Refusing to run destructive tests/);
  });

  test('returns the db name for a proper test database', () => {
    expect(assertTestDatabase({ NODE_ENV: 'test', DATABASE_URL: TEST_URL }))
      .toEqual({ dbName: 'trello_clone_test' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && NODE_ENV=test DATABASE_URL=postgresql://postgres:postgres@localhost:5433/trello_clone_test npm test -- assertTestDatabase`
Expected: FAIL — `Cannot find module '../lib/assertTestDatabase.js'`.

- [ ] **Step 3: Write the minimal implementation**

```js
// server/src/lib/assertTestDatabase.js
/**
 * Hard guard against running destructive test logic (table truncation) against
 * a non-test database. Throws unless NODE_ENV==="test" AND the database name
 * contains "test".
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ dbName: string }}
 */
export function assertTestDatabase(env = process.env) {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error('[test-db-guard] DATABASE_URL is not set. Refusing to run tests.');
  }
  let dbName;
  try {
    dbName = new URL(url).pathname.replace(/^\//, '');
  } catch {
    throw new Error(`[test-db-guard] DATABASE_URL is not a valid URL: ${url}`);
  }
  const looksLikeTest = /test/i.test(dbName);
  if (env.NODE_ENV !== 'test' || !looksLikeTest) {
    throw new Error(
      '[test-db-guard] Refusing to run destructive tests.\n' +
        `  NODE_ENV must be "test" (got "${env.NODE_ENV}")\n` +
        `  and the database name must contain "test" (got "${dbName}").\n` +
        '  This guards against truncating a real database.'
    );
  }
  return { dbName };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && NODE_ENV=test DATABASE_URL=postgresql://postgres:postgres@localhost:5433/trello_clone_test npm test -- assertTestDatabase`
Expected: PASS — 4 passing.

- [ ] **Step 5: Wire the guard into the destructive setup**

In `server/src/__tests__/setup.js`, add immediately after the existing imports (top of file, before any hook is registered):

```js
import { assertTestDatabase } from '../lib/assertTestDatabase.js';

// Fail fast before any test truncates tables, if pointed at a non-test DB.
assertTestDatabase();
```

- [ ] **Step 6: Verify the guard blocks a non-test DB**

Run: `cd server && NODE_ENV=development DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trello_clone npm test -- boards 2>&1 | head -20`
Expected: the suite aborts with `[test-db-guard] Refusing to run destructive tests.` and does NOT connect/truncate.

- [ ] **Step 7: Commit**

```bash
git add server/src/lib/assertTestDatabase.js server/src/__tests__/assertTestDatabase.test.js server/src/__tests__/setup.js
git commit -m "feat(server): enforce test-database safety guard in code"
```

---

### Task 2: Ephemeral Postgres via Docker Compose

Provide a throwaway, hermetic Postgres the test pyramid runs against — gone after every run.

**Files:**
- Create: `docker-compose.yml`
- Modify: `.env.example` (document the test DB URL)

**Interfaces:**
- Produces: a compose service `db` reachable at `postgresql://postgres:postgres@localhost:5433/trello_clone_test`, data on `tmpfs` (never persisted), with a healthcheck so callers can `--wait`.

- [ ] **Step 1: Create the compose file**

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: trello_clone_test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data   # ephemeral: data lives in RAM, dropped on teardown
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d trello_clone_test"]
      interval: 2s
      timeout: 3s
      retries: 20
```

- [ ] **Step 2: Bring it up and confirm health**

Run: `docker compose up -d --wait db && docker compose ps`
Expected: the `db` service shows state `running` and health `healthy`.

- [ ] **Step 3: Confirm connectivity**

Run: `docker compose exec db pg_isready -U postgres -d trello_clone_test`
Expected: `... accepting connections`.

- [ ] **Step 4: Document the test URL in `.env.example`**

Append to `.env.example`:

```env

# Ephemeral test database (docker compose service "db"). Used by `npm run verify`.
# TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5433/trello_clone_test"
```

- [ ] **Step 5: Tear down (confirm ephemerality) and commit**

```bash
docker compose down -v
git add docker-compose.yml .env.example
git commit -m "feat: add ephemeral postgres for hermetic test runs"
```

---

### Task 3: Root task runner + one-command `verify`

Give the agent (and CI) a single hermetic command. A root `package.json` holds dev tooling and orchestration; a Node script drives the pipeline so it is OS-portable and tears the DB down even on failure.

**Files:**
- Create: `package.json` (repo root)
- Create: `scripts/verify.mjs`
- Create: `.gitignore` entry update (root already ignores `node_modules/`)

**Interfaces:**
- Produces root npm scripts: `setup`, `install:all`, `db:up`, `db:down`, `migrate:test`, `test:server`, `test:client`, `build:client`, `test:e2e`, `verify`.
- `scripts/verify.mjs` constant `TEST_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/trello_clone_test'`. In CI (`process.env.CI` set) it does NOT manage compose and expects the DB already provided; otherwise it runs `db:up`/`db:down` around the pipeline.

- [ ] **Step 1: Create the root `package.json`**

```json
{
  "name": "trello-clone-root",
  "private": true,
  "type": "module",
  "scripts": {
    "setup": "npm install && npm run install:all",
    "install:all": "npm --prefix server install && npm --prefix client install && npm --prefix e2e install",
    "db:up": "docker compose up -d --wait db",
    "db:down": "docker compose down -v",
    "migrate:test": "npm --prefix server exec -- prisma migrate deploy",
    "test:server": "npm --prefix server test",
    "test:client": "npm --prefix client test",
    "build:client": "npm --prefix client run build",
    "test:e2e": "npm --prefix e2e test",
    "verify": "node scripts/verify.mjs"
  }
}
```

- [ ] **Step 2: Create the orchestrator**

```js
// scripts/verify.mjs
import { execSync } from 'node:child_process';

const TEST_DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5433/trello_clone_test';
const isCI = Boolean(process.env.CI);

function run(cmd, extraEnv = {}) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...extraEnv } });
}

const dbEnv = { DATABASE_URL: TEST_DATABASE_URL };
const testEnv = { ...dbEnv, NODE_ENV: 'test' };
// e2e boots the real server (must listen), so NOT NODE_ENV=test; CI flag makes
// Playwright start a fresh server instead of reusing one.
const e2eEnv = { ...dbEnv, NODE_ENV: 'e2e', CI: 'true' };

try {
  if (!isCI) run('npm run db:up');
  run('npm run migrate:test', dbEnv);
  run('npm run test:server', testEnv);
  run('npm run test:client');
  run('npm run build:client');
  run('npm --prefix e2e exec -- playwright install chromium');
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
```

- [ ] **Step 3: Install root tooling**

Run: `npm install` (root)
Expected: creates root `package-lock.json` and `node_modules/` (empty of deps for now; lint/format deps added in later tasks).

- [ ] **Step 4: Dry-run the full pipeline**

Run: `npm run verify`
Expected: db comes up → migrate deploy → server tests PASS → client tests PASS → client build succeeds → Playwright installs chromium → e2e PASS → `✅ verify passed` → db torn down. (If e2e needs system deps locally, Task 5 covers `--with-deps`.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json scripts/verify.mjs
git commit -m "feat: add root verify orchestrator and task runner"
```

---

### Task 4: Reproducible devbox image

An ephemeral, isolated box with the whole toolchain pinned, so any agent run starts from an identical environment.

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `.devcontainer/devcontainer.json`

**Interfaces:**
- Produces a `node:20-bookworm` image with Playwright browser system deps and the repo deps preinstalled; `.devcontainer` wires VS Code / agent devbox to the same image plus the `db` compose service.

- [ ] **Step 1: Create the `.dockerignore`**

```
**/node_modules
**/dist
**/playwright-report
**/test-results
**/screenshots
.git
*.log
.env
.env.*
```

- [ ] **Step 2: Create the `Dockerfile`**

```dockerfile
# Reproducible devbox for autonomous agent runs.
FROM node:20-bookworm

# Tools the harness expects natively.
RUN apt-get update && apt-get install -y --no-install-recommends \
      git ca-certificates postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
COPY . .

# Install all workspaces + Playwright browsers with system deps.
RUN npm install \
 && npm run install:all \
 && npm --prefix server exec -- prisma generate \
 && npm --prefix e2e exec -- playwright install --with-deps chromium

CMD ["bash"]
```

- [ ] **Step 3: Create `.devcontainer/devcontainer.json`**

```json
{
  "name": "trello-clone-devbox",
  "build": { "dockerfile": "../Dockerfile", "context": ".." },
  "forwardPorts": [4000, 5173, 5433],
  "postCreateCommand": "npm run setup",
  "remoteEnv": {
    "TEST_DATABASE_URL": "postgresql://postgres:postgres@localhost:5433/trello_clone_test"
  }
}
```

- [ ] **Step 4: Build the image**

Run: `docker build -t trello-clone-devbox .`
Expected: build completes; final layer installs chromium successfully.

- [ ] **Step 5: Smoke-test the toolchain inside the box**

Run: `docker run --rm trello-clone-devbox bash -lc "node --version && npx prisma --version && git --version"`
Expected: Node v20.x, Prisma version printed, git version printed.

- [ ] **Step 6: Commit**

```bash
git add Dockerfile .dockerignore .devcontainer/devcontainer.json
git commit -m "feat: add reproducible devbox image and devcontainer"
```

---

### Task 5: Make the e2e run hermetic and unattended

Today Playwright boots `npm run dev` for both servers (`e2e/playwright.config.ts:16`). Ensure those inherit the ephemeral DB and that browsers/system deps are present so the run is non-interactive.

**Files:**
- Modify: `e2e/playwright.config.ts` (comment clarifying env inheritance; raise webServer timeout)
- Modify: `scripts/verify.mjs` (use `--with-deps` so a bare box can run e2e)

**Interfaces:**
- Consumes: `DATABASE_URL` + `NODE_ENV=e2e` + `CI=true` from the parent process env (set by `verify.mjs`). The booted server reads these because `dotenv` does not override pre-set env vars.

- [ ] **Step 1: Annotate and harden the Playwright webServer config**

In `e2e/playwright.config.ts`, replace the `webServer` array with:

```ts
  webServer: [
    {
      // Inherits DATABASE_URL / NODE_ENV from the parent process (verify.mjs).
      // dotenv in the server does not override already-set env vars.
      command: 'cd ../server && npm run dev',
      port: 4000,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../client && npm run dev',
      port: 5173,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
```

- [ ] **Step 2: Use `--with-deps` for the browser install in verify**

In `scripts/verify.mjs`, change the Playwright install line to:

```js
  run('npm --prefix e2e exec -- playwright install --with-deps chromium');
```

- [ ] **Step 3: Run the full pipeline end-to-end**

Run: `npm run verify`
Expected: e2e boots both dev servers against `trello_clone_test`, all e2e specs PASS, `✅ verify passed`.

- [ ] **Step 4: Commit**

```bash
git add e2e/playwright.config.ts scripts/verify.mjs
git commit -m "feat(e2e): make e2e run hermetic and unattended"
```

---

### Task 6: ESLint flat config (fast feedback) for server + client

A cheap, deterministic correctness signal before the slow test suites. e2e (TypeScript) is out of scope for this pass.

**Files:**
- Create: `eslint.config.js` (repo root)
- Modify: `package.json` (root) — add `lint` script + devDeps

**Interfaces:**
- Produces root script `lint` = `eslint .` covering `server/**/*.js` (Node+Jest globals, ESM) and `client/**/*.{js,jsx}` (browser globals, React, JSX).

- [ ] **Step 1: Add lint tooling to the root `package.json`**

Add to root `package.json`:

```json
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "eslint": "^9.0.0",
    "eslint-plugin-react": "^7.34.0",
    "globals": "^15.0.0"
  }
```

And add to `scripts`: `"lint": "eslint ."`.

- [ ] **Step 2: Create the flat config**

```js
// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'e2e/**',
      '**/playwright-report/**',
      '**/screenshots/**',
      'server/src/prisma/migrations/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['server/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.jest },
    },
  },
  {
    files: ['client/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
];
```

- [ ] **Step 3: Install and run lint**

Run: `npm install && npm run lint`
Expected: ESLint runs across server + client. It will likely report real violations (e.g. unused vars).

- [ ] **Step 4: Fix all reported violations**

Resolve each error/warning ESLint reports (remove unused vars, fix undefined globals, etc.). Re-run `npm run lint` until clean.
Expected (after fixes): `npm run lint` exits 0 with no output.

- [ ] **Step 5: Add lint to `verify`**

In `scripts/verify.mjs`, add as the FIRST step inside the `try` (before `db:up`):

```js
  run('npm run lint');
```

- [ ] **Step 6: Commit**

```bash
git add eslint.config.js package.json package-lock.json scripts/verify.mjs
git add -A server client
git commit -m "feat: add eslint flat config and fix violations"
```

---

### Task 7: Prettier formatting gate

Deterministic formatting so agent diffs stay minimal and reviewable.

**Files:**
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Modify: `package.json` (root) — add `format`, `format:check` scripts + devDep

**Interfaces:**
- Produces root scripts `format` (write) and `format:check` (verify, used by CI/verify).

- [ ] **Step 1: Add Prettier to root `package.json`**

Add to `devDependencies`: `"prettier": "^3.2.0"`.
Add to `scripts`: `"format": "prettier --write ."`, `"format:check": "prettier --check ."`.

- [ ] **Step 2: Create config + ignore**

```json
// .prettierrc.json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "es5",
  "printWidth": 80
}
```

```
# .prettierignore
**/node_modules
**/dist
**/package-lock.json
**/playwright-report
**/screenshots
server/src/prisma/migrations
```

- [ ] **Step 3: Format the tree**

Run: `npm install && npm run format`
Expected: Prettier rewrites files to canonical style.

- [ ] **Step 4: Verify the check passes**

Run: `npm run format:check`
Expected: `All matched files use Prettier code style!`

- [ ] **Step 5: Add to `verify` and commit**

In `scripts/verify.mjs`, add right after the `lint` step:

```js
  run('npm run format:check');
```

```bash
git add .prettierrc.json .prettierignore package.json package-lock.json scripts/verify.mjs
git add -A
git commit -m "feat: add prettier formatting gate"
```

---

### Task 8: Coverage instrumentation + enforced baseline

Make "did I keep the tests meaningful" measurable and enforced, with a baseline that can ratchet up. (Diff/agent-touched coverage targets are an org/metrics concern, explicitly out of scope here.)

**Files:**
- Modify: `server/jest.config.js` (coverage + thresholds)
- Modify: `client/vite.config.js` (coverage provider + thresholds)
- Modify: `server/package.json`, `client/package.json` (coverage devDep / script)

**Interfaces:**
- Produces: `npm run test:server` and `npm run test:client` emit coverage and FAIL if below the recorded baseline thresholds.

- [ ] **Step 1: Measure current server coverage**

Run: `cd server && NODE_ENV=test DATABASE_URL=postgresql://postgres:postgres@localhost:5433/trello_clone_test node --experimental-vm-modules node_modules/.bin/jest --coverage --coverageProvider=v8`
(Bring the DB up first with `npm run db:up` from root.)
Record the `% Lines`, `% Statements`, `% Functions`, `% Branches` from the summary table.

- [ ] **Step 2: Set server thresholds just below measured**

In `server/jest.config.js`, set `collectCoverage` and `coverageThreshold.global` to the measured numbers rounded DOWN to the nearest 5 (so the suite passes today and can be ratcheted up later):

```js
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  testPathIgnorePatterns: ['/node_modules/', 'setup\\.js$'],
  coverageProvider: 'v8',
  collectCoverageFrom: ['src/**/*.js', '!src/**/__tests__/**', '!src/seed/**'],
  coverageThreshold: {
    // Replace with measured-rounded-down values from Step 1.
    global: { lines: 70, statements: 70, functions: 70, branches: 60 },
  },
};
```

Change `server/package.json` `test` script to include coverage:
`"test": "node --experimental-vm-modules node_modules/.bin/jest --forceExit --detectOpenHandles --coverage"`.

- [ ] **Step 3: Verify server coverage gate**

Run (DB up): `npm run test:server` from root with `NODE_ENV=test DATABASE_URL=...` (or via `npm run verify`).
Expected: tests PASS and coverage meets thresholds; lowering a threshold below actual must keep it green, raising above actual must fail (sanity-check once).

- [ ] **Step 4: Add client coverage**

Add to `client/package.json` devDeps: `"@vitest/coverage-v8": "^1.0.0"`. In `client/vite.config.js`, extend the `test` block:

```js
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/__tests__/**', 'src/main.jsx'],
      // Replace with measured-rounded-down values.
      thresholds: { lines: 60, statements: 60, functions: 60, branches: 55 },
    },
  },
```

Change `client/package.json` `test` script to: `"test": "vitest run --coverage"`.

- [ ] **Step 5: Measure, set, and verify client coverage**

Run: `cd client && npm install && npm test`
Adjust the thresholds in Step 4 to the measured-rounded-down values, then re-run.
Expected: client tests PASS with coverage at/above thresholds.

- [ ] **Step 6: Commit**

```bash
git add server/jest.config.js server/package.json client/vite.config.js client/package.json client/package-lock.json
git commit -m "feat: enforce baseline coverage on server and client"
```

---

### Task 9: CI workflow — the eval gate

Run the exact same `verify` on every push and PR, using a service Postgres instead of compose.

**Files:**
- Create: `.github/workflows/verify.yml`

**Interfaces:**
- Consumes: root `verify`/scripts with `CI=true` (so `verify.mjs` skips compose) and `TEST_DATABASE_URL` pointed at the service container on port 5433.

- [ ] **Step 1: Create the workflow**

```yaml
# .github/workflows/verify.yml
name: verify
on:
  push:
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    services:
      db:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: trello_clone_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd "pg_isready -U postgres -d trello_clone_test"
          --health-interval 2s --health-timeout 3s --health-retries 20
    env:
      CI: 'true'
      DATABASE_URL: postgresql://postgres:postgres@localhost:5433/trello_clone_test
      NODE_ENV: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm run setup
      - run: npm run lint
      - run: npm run format:check
      - run: npm run migrate:test
      - run: npm run test:server
      - run: npm run test:client
      - run: npm run build:client
      - run: npm --prefix e2e exec -- playwright install --with-deps chromium
      - name: e2e
        run: npm run test:e2e
        env:
          NODE_ENV: e2e
```

- [ ] **Step 2: Validate the workflow locally (lint the YAML)**

Run: `npx --yes @action-validator/cli .github/workflows/verify.yml || python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/verify.yml')); print('yaml ok')"`
Expected: no schema/syntax errors (or `yaml ok`).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/verify.yml
git commit -m "ci: run verify (lint, format, full test pyramid) on push and PR"
```

> Note: this job runs once the repo has a GitHub remote. With no remote today it is dormant but correct; pushing to GitHub activates it. No remote is created by this plan.

---

### Task 10: Update agent-facing docs

Point `CLAUDE.md` and `README.md` at the new one-command workflow and replace the prose-only DB warning with a reference to the code guard.

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

**Interfaces:** none (documentation).

- [ ] **Step 1: Update `CLAUDE.md` commands + safety section**

In `CLAUDE.md`, add a row to the Key commands table: `| Verify everything (lint+format+all tests) | `npm run verify` (repo root) |`. Replace the "CRITICAL: Test database safety" prose with:

```md
## Test database safety (enforced in code)
Destructive test setup is guarded by `server/src/lib/assertTestDatabase.js`: tests
refuse to run unless `NODE_ENV=test` AND the database name contains `test`. The
hermetic path is `npm run verify` (repo root), which runs everything against an
ephemeral Postgres (`docker-compose.yml`, port 5433) and tears it down after.
Never point tests at the dev database manually.
```

- [ ] **Step 2: Update `README.md`**

Add a short "Verify (agents & CI)" subsection under Setup documenting `npm run setup` then `npm run verify`, and mention the devbox (`docker build -t trello-clone-devbox .` / `.devcontainer`).

- [ ] **Step 3: Final full verification**

Run: `npm run verify`
Expected: lint → format:check → migrate → server tests (+coverage) → client tests (+coverage) → client build → e2e → `✅ verify passed`.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: document verify workflow, devbox, and code-enforced db guard"
```

---

### Task 11: Context-standard templates

Ship the reusable artifacts our model names under "Context standards": the implementation-plan template (the `spec → plan → PR` middle artifact), an agent-consumable spec template, and a PR-review checklist. These are what the skills and subagents in Tasks 12–13 consume.

**Files:**
- Create: `.claude/templates/implementation-plan.md`
- Create: `.claude/templates/agent-spec.md`
- Create: `.claude/templates/pr-review-checklist.md`

**Interfaces:** none (markdown templates referenced by skills/subagents below).

- [ ] **Step 1: Create the implementation-plan template**

```md
<!-- .claude/templates/implementation-plan.md -->
# <Task title> — Implementation Plan

**Spec:** <link to ticket / agent-spec>
**Author:** <agent> · **Approved by:** <engineer> · **Date:** <YYYY-MM-DD>

## Goal
<One sentence: what this change delivers.>

## Approach
<2–4 sentences: how, and why this way over alternatives.>

## Files to touch
- `path` — <what changes>

## Test plan
- <unit/integration/e2e cases that prove it; commands to run>

## Blast radius & risk
- **Blast radius:** <files/systems affected>
- **Reversibility:** <easy / migration / data>
- **Novelty:** <routine / novel pattern>
- **Risk tier:** <low → auto-proceed | high → human sign-off required>

## Out of scope
- <explicitly not doing>
```

- [ ] **Step 2: Create the agent-spec template**

```md
<!-- .claude/templates/agent-spec.md -->
# <Feature> — Agent-Consumable Spec

## What & why
<The user-facing outcome and the reason. No implementation detail.>

## Acceptance criteria
- [ ] <observable, testable behavior>

## Constraints
- <API shape, data, perf, security boundaries the agent must respect>

## Non-goals
- <what this ticket does NOT include>
```

- [ ] **Step 3: Create the PR-review checklist**

```md
<!-- .claude/templates/pr-review-checklist.md -->
# Agent-PR Review Checklist

- [ ] Implements the spec's acceptance criteria — nothing more (no scope creep)
- [ ] `npm run verify` passes (lint, format, server+client+e2e, coverage)
- [ ] New behavior is covered by tests; coverage did not drop
- [ ] No secrets/credentials added; `.env*` untouched
- [ ] DB-destructive code stays behind the test-db guard
- [ ] No prod credentials, no broadened network egress
- [ ] Diff is minimal and matches the approved plan's blast radius
- [ ] Conventional commit message; no unrelated churn
```

- [ ] **Step 4: Verify and commit**

Run: `ls .claude/templates`
Expected: the three `.md` files listed.

```bash
git add .claude/templates
git commit -m "feat(harness): add plan, spec, and PR-review templates"
```

---

### Task 12: Project skills (`.claude/skills/`)

The procedures an agent runs in this repo, named per our model's minimum set. Each is a `SKILL.md` with `name`/`description` frontmatter so Claude Code auto-discovers it.

**Files:**
- Create: `.claude/skills/spec-to-plan/SKILL.md`
- Create: `.claude/skills/verify-changes/SKILL.md`
- Create: `.claude/skills/open-pr/SKILL.md`

**Interfaces:**
- `verify-changes` is the canonical self-check: it shells out to `npm run verify` (Task 3) and reports.
- `spec-to-plan` consumes `.claude/templates/implementation-plan.md` (Task 11).
- `open-pr` consumes `.claude/templates/pr-review-checklist.md` (Task 11) and requires `verify-changes` green.

- [ ] **Step 1: Create the `spec-to-plan` skill**

```md
---
name: spec-to-plan
description: Use BEFORE writing any code for a ticket/spec. Drafts an implementation plan from the spec for human approval — the spec→plan→PR gate. Produces plan.md from the repo's plan template.
---

# spec-to-plan

1. Read the spec (ticket or `.claude/templates/agent-spec.md` output). If it lacks acceptance criteria, stop and ask.
2. Explore the repo to ground the approach (controllers/routes/middleware on the server, components/pages on the client).
3. Fill `.claude/templates/implementation-plan.md` completely — files to touch, approach, test plan, and the **risk tier** (blast radius · reversibility · novelty · size).
4. Save as `docs/superpowers/plans/YYYY-MM-DD-<slug>.md`.
5. **Gate:** if risk tier is **high** (auth, Prisma migrations, money/data paths, novel pattern), STOP and request human sign-off before coding. If **low**, proceed.
```

- [ ] **Step 2: Create the `verify-changes` skill**

```md
---
name: verify-changes
description: Use to verify changes in this repo before committing or opening a PR. Runs the full hermetic gate (lint, format, server+client+e2e tests, coverage) against an ephemeral database and reports pass/fail.
---

# verify-changes

The single source of truth for "is my change correct" in this repo.

1. From the repo root run: `npm run verify`.
   - It brings up an ephemeral Postgres (port 5433), migrates, runs ESLint, Prettier check, server (Jest) + client (Vitest) + e2e (Playwright) suites with coverage, builds the client, then tears the DB down.
2. If it fails, read the first failing step, fix the root cause (do NOT lower coverage thresholds or weaken the test-db guard to make it pass), and re-run.
3. Never run `npm test` against a non-test database — the test-db guard (`server/src/lib/assertTestDatabase.js`) will refuse, and that refusal is correct.
4. Report the final result and, on success, the coverage summary.
```

- [ ] **Step 3: Create the `open-pr` skill**

```md
---
name: open-pr
description: Use to land completed work to the group standard. Confirms the plan was approved and verify is green, self-reviews against the checklist, writes a conventional commit, and opens a PR.
---

# open-pr

1. Confirm an approved plan exists in `docs/superpowers/plans/` for this work.
2. Run the `verify-changes` skill — must be green. If red, stop and fix.
3. Dispatch the `agent-pr-self-reviewer` subagent over the diff; resolve anything it flags.
4. Self-check against `.claude/templates/pr-review-checklist.md`.
5. Commit with a conventional message (`feat:`/`fix:`/`chore:` …), then `gh pr create` with a body that links the spec and the plan and summarizes the change + test evidence.
```

- [ ] **Step 4: Verify discovery and commit**

Run: `ls .claude/skills/*/SKILL.md`
Expected: the three SKILL.md files listed. (In an interactive Claude Code session they appear in the skills list.)

```bash
git add .claude/skills
git commit -m "feat(harness): add spec-to-plan, verify-changes, open-pr skills"
```

---

### Task 13: Subagents (`.claude/agents/`)

The reviewer/author roles from our model's minimum set, as project subagents Claude Code can dispatch. Each is a markdown file with `name`/`description`/`tools` frontmatter.

**Files:**
- Create: `.claude/agents/agent-pr-self-reviewer.md`
- Create: `.claude/agents/code-reviewer.md`
- Create: `.claude/agents/test-author.md`

**Interfaces:** dispatched by name (e.g. by the `open-pr` skill in Task 12). Read-only reviewers get read/search tools only; `test-author` may edit tests.

- [ ] **Step 1: Create the `agent-pr-self-reviewer` subagent**

```md
---
name: agent-pr-self-reviewer
description: Reviews an agent-authored diff BEFORE a human looks — bugs, security, and scope creep. Use after changes are complete and verify is green, before opening a PR.
tools: Read, Grep, Glob, Bash
---

You are the last automated check before a human reviews an agent's PR. Examine the staged/working diff (`git diff`).

Flag, with file:line and a concrete fix:
- **Correctness bugs** — logic errors, unhandled errors, wrong API contracts (`{ data }` / `{ error }`).
- **Security** — authz gaps on protected routes, secret leakage, injection, missing Zod validation.
- **Scope creep** — anything beyond the approved plan's blast radius; unrelated churn.
- **Test integrity** — weakened coverage thresholds, a disabled/loosened test-db guard, skipped tests.

Return a verdict: BLOCK (with the must-fix list) or PASS. Default to BLOCK if uncertain.
```

- [ ] **Step 2: Create the `code-reviewer` subagent**

```md
---
name: code-reviewer
description: Reviews architecture and intent against the group checklist — does the change fit the repo's patterns and the spec. Use for non-trivial changes before merge.
tools: Read, Grep, Glob, Bash
---

You review for architecture and intent (not style — lint handles that). Check the diff against `.claude/templates/pr-review-checklist.md` and the repo conventions in `CLAUDE.md`:
- Does it follow the controller/route/middleware (server) and component/page (client) patterns?
- Is the change the simplest one that satisfies the spec? Any reinvention of existing helpers?
- Are Prisma schema/migration changes safe and reversible?

Return concrete, file:line findings ranked by severity, and an overall APPROVE / REQUEST-CHANGES.
```

- [ ] **Step 3: Create the `test-author` subagent**

```md
---
name: test-author
description: Writes or strengthens tests for a change — Jest (server), Vitest/RTL (client), Playwright (e2e) — to cover new behavior and hold coverage. Use when a change lacks tests or coverage dropped.
tools: Read, Grep, Glob, Edit, Write, Bash
---

You add meaningful tests for the change under review. Match the existing patterns:
- Server: Jest + Supertest via `server/src/__tests__/setup.js` helpers (`createTestUser`, etc.). Never bypass the test-db guard.
- Client: Vitest + React Testing Library; query by role/text, not implementation detail.
- e2e: Playwright specs in `e2e/tests`.

Write tests that assert behavior (not snapshots of internals). Run the relevant suite via `npm run verify` (or the per-suite script) and confirm they pass and cover the new paths.
```

- [ ] **Step 4: Verify and commit**

Run: `ls .claude/agents`
Expected: the three subagent files listed.

```bash
git add .claude/agents
git commit -m "feat(harness): add self-reviewer, code-reviewer, test-author subagents"
```

---

### Task 14: Guardrails — `.claude/settings.json` + harness docs

Reduce permission friction for the autonomous loop and add an auto-format guardrail (our model's "formatter & linter" hook). Document the harness kit in `CLAUDE.md`.

**Files:**
- Create: `.claude/settings.json`
- Modify: `CLAUDE.md` (add a "Harness kit" section)

**Interfaces:** none.

- [ ] **Step 1: Create `.claude/settings.json`**

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run verify)",
      "Bash(npm run lint)",
      "Bash(npm run format:check)",
      "Bash(npm run test:server)",
      "Bash(npm run test:client)",
      "Bash(npm run test:e2e)",
      "Bash(npm run db:up)",
      "Bash(npm run db:down)",
      "Bash(npm run migrate:test)",
      "Bash(npm --prefix server exec -- prisma generate)",
      "Bash(docker compose up -d --wait db)",
      "Bash(docker compose down -v)",
      "Bash(git add :*)",
      "Bash(git commit :*)",
      "Bash(git status)",
      "Bash(git diff :*)"
    ],
    "deny": [
      "Read(./server/.env)",
      "Read(./.env)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "file=$(cat | jq -r '.tool_input.file_path // empty'); case \"$file\" in *.js|*.jsx|*.mjs|*.json|*.css) [ -f \"$file\" ] && npx --yes prettier --write \"$file\" >/dev/null 2>&1 ;; esac; exit 0"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Verify the hook is valid JSON and runs**

Run: `jq . .claude/settings.json >/dev/null && echo "valid json"`
Expected: `valid json`.
Then sanity-check the hook command in isolation: `echo '{"tool_input":{"file_path":"server/src/index.js"}}' | bash -c 'file=$(cat | jq -r ".tool_input.file_path // empty"); echo "would format: $file"'`
Expected: `would format: server/src/index.js`.

- [ ] **Step 3: Add a "Harness kit" section to `CLAUDE.md`**

Append to `CLAUDE.md`:

```md
## Harness kit (`.claude/`)
This repo ships the agentic-development primitives:
- **Skills** (`.claude/skills/`): `spec-to-plan` (draft a plan for approval before code), `verify-changes` (`npm run verify`), `open-pr` (land to standard).
- **Subagents** (`.claude/agents/`): `agent-pr-self-reviewer`, `code-reviewer`, `test-author`.
- **Templates** (`.claude/templates/`): implementation-plan, agent-spec, PR-review checklist.
- **Guardrails** (`.claude/settings.json`): permission allowlist for the verify/git loop + auto-format on edit.

The loop: spec → `spec-to-plan` (human approves the plan) → code → `verify-changes` → `open-pr`.
```

- [ ] **Step 4: Commit**

```bash
git add .claude/settings.json CLAUDE.md
git commit -m "feat(harness): add permission allowlist, auto-format hook, harness docs"
```

---

## Self-Review

**Spec coverage (tech-axis Phase 3):**
- Native harness preserved, no repo MCP — Global Constraints. ✓
- Code-enforced test-DB safety — Task 1. ✓
- Ephemeral isolated DB/devbox — Tasks 2 (DB) + 4 (image/devcontainer). ✓
- One-command hermetic verify — Task 3. ✓
- Hermetic, unattended e2e — Task 5. ✓
- Fast deterministic feedback (lint + format) — Tasks 6, 7. ✓
- Coverage instrumented + enforced — Task 8. ✓
- Eval-as-gate in CI — Task 9. ✓
- Agent-facing docs — Task 10. ✓
- Harness primitives (skills, subagents, templates, guardrails) — Tasks 11–14, named per the model's minimum asset set (`tldr.html`/`assets.html`). ✓
- Out of scope by user decision: TypeScript/typecheck, org roles, metrics/governance dashboards, fleet runners, merge/integration agent, oversight plane. MCP servers for the systems around the code (GitHub/Jira/docs) are named in our model but deferred — they need org credentials, not repo changes. (Noted, not planned.)

**Placeholder scan:** Coverage thresholds in Task 8 are deliberately "measure-then-set" with an exact procedure and commands — not a TBD deliverable. No other placeholders.

**Type/name consistency:** `assertTestDatabase` signature/return used identically in Tasks 1 and the guard call. `TEST_DATABASE_URL` value identical across Tasks 2, 3, 8, 9. Root scripts referenced in `verify.mjs` (Task 3) match names defined in root `package.json` and CI (Task 9).
