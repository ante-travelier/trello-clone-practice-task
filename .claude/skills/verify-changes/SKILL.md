---
name: verify-changes
description: Use to verify changes in this repo before committing or opening a PR. Runs the full hermetic gate (lint, format, server+client+e2e tests, coverage) against an ephemeral database and reports pass/fail.
---

# verify-changes

The single source of truth for "is my change correct" in this repo.

1. From the repo root run: `npm run verify`.
   - It brings up an ephemeral Postgres (port 55433), migrates, runs ESLint, Prettier check, server (Jest) + client (Vitest) + e2e (Playwright) suites with coverage, builds the client, then tears the DB down.
2. If it fails, read the first failing step, fix the root cause (do NOT lower coverage thresholds or weaken the test-db guard to make it pass), and re-run.
3. Never run `npm test` against a non-test database — the test-db guard (`server/src/lib/assertTestDatabase.js`) will refuse, and that refusal is correct.
4. Report the final result and, on success, the coverage summary.
