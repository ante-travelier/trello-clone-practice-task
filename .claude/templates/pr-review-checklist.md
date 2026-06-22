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
