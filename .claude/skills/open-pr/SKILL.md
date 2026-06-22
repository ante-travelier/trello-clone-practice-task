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
