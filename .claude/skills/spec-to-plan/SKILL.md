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
