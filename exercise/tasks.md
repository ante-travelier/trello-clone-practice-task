# Claude Code Exercises — Trello Clone

Work through these tasks using Claude Code on this Trello clone repo. Each task is self-contained. The project has a React + Vite frontend (`client/`), a Node.js/Express API (`server/`), PostgreSQL via Prisma, and Playwright E2E tests (`e2e/`).

> **Setup:** Make sure PostgreSQL is running, copy `.env.example` to `server/.env`, run `cd server && npx prisma migrate dev`, then start both servers (`cd server && npm run dev` and `cd client && npm run dev`).

---

## Task 1 — Bug fix: card count on board tiles

**Difficulty:** Easy | **Area:** Frontend

The boards dashboard (`client/src/pages/BoardsPage.jsx`) shows board tiles but doesn't display how many cards each board contains. The API already returns lists and cards when you hit `GET /api/boards/:id`, but the boards index endpoint (`GET /api/boards`) only returns top-level board fields.

**What to do:**
1. Update the `GET /api/boards` endpoint to include a total card count per board (hint: Prisma's `_count` or `include` with nested relations).
2. Display the count on each board tile in `BoardsPage.jsx` (e.g. "12 cards").

---

## Task 2 — Add a "copy card" feature

**Difficulty:** Easy–Medium | **Area:** Full-stack

Users should be able to duplicate a card (including its labels and checklist structure).

**What to do:**
1. Add a "Copy" button inside the card modal (`client/src/components/CardModal.jsx`).
2. Create a new API endpoint (e.g. `POST /api/cards/:cardId/copy`) that duplicates the card, its labels, and its checklists/items into the same list, placed at the bottom.
3. The UI should refresh the board after copying.

---

## Task 3 — Card search / filter

**Difficulty:** Medium | **Area:** Frontend

Add a search bar to the board view that filters visible cards by title in real-time (client-side filtering, no API changes needed).

**What to do:**
1. Add a search input above the lists in `BoardView.jsx`.
2. As the user types, only cards whose title matches the query should be visible.
3. If a list has zero matching cards, it should still be visible (but empty).
4. Clearing the search restores all cards.

---

## Task 4 — Add card comments

**Difficulty:** Medium | **Area:** Full-stack

Users should be able to leave comments on cards.

**What to do:**
1. Add a `Comment` model to the Prisma schema (id, text, createdAt, cardId, userId) and run a migration.
2. Create API routes: `POST /api/cards/:cardId/comments` and `GET /api/cards/:cardId/comments`.
3. Display comments in the card modal with the user's name and timestamp.
4. Add an input to post a new comment.

---

## Task 5 — Dark mode toggle

**Difficulty:** Medium | **Area:** Frontend

Add a dark mode toggle to the header that persists across page reloads.

**What to do:**
1. Add a toggle button in the `Header` component.
2. Use Tailwind's `dark:` variant (the project already has Tailwind configured).
3. Persist the user's preference in `localStorage`.
4. Apply dark styles to the main layout — boards page, board view, card modal, and header.

---

## Task 6 — Write an E2E test for drag-and-drop

**Difficulty:** Medium | **Area:** Testing (Playwright)

The E2E suite (`e2e/`) has tests for auth, boards, lists/cards, and card details — but none for drag-and-drop reordering.

**What to do:**
1. Create `e2e/tests/drag-drop.spec.ts`.
2. Write a test that:
   - Logs in and navigates to a board with multiple lists/cards.
   - Drags a card from one position to another within the same list.
   - Verifies the new order persists after a page reload.
3. Bonus: test cross-list card dragging.

---

## Task 7 — Board sharing (invite by email)

**Difficulty:** Hard | **Area:** Full-stack

Allow a board owner to invite other registered users by email.

**What to do:**
1. Add a `BoardMember` join model to Prisma (boardId, userId, role: "owner" | "member") and migrate.
2. Create `POST /api/boards/:id/members` (accepts an email, finds the user, adds them).
3. Update board queries so members can also see and edit shared boards.
4. Add a "Share" button + modal on the board view to enter an email and send the invite.
5. Show shared boards on the boards dashboard (visually distinguished from owned boards).

---

## Task 8 — Add a CI pipeline

**Difficulty:** Medium | **Area:** DevOps

Create a GitHub Actions workflow that runs on every PR.

**What to do:**
1. Create `.github/workflows/ci.yml`.
2. The pipeline should:
   - Install dependencies for both `client/` and `server/`.
   - Run `npm test` in both.
   - Run Prisma migrations against a PostgreSQL service container.
   - Run Playwright E2E tests.
3. Make sure the workflow uses a matrix or parallel jobs where possible.

---

## Task 9 — Refactor: extract a shared API error handler

**Difficulty:** Easy | **Area:** Backend refactor

Look at the controller files in `server/src/controllers/` — many of them repeat the same try/catch + error response pattern.

**What to do:**
1. Ask Claude Code to identify the repeated pattern across controllers.
2. Create an `asyncHandler` wrapper (or similar) that eliminates the duplication.
3. Refactor all controllers to use it.
4. Make sure existing tests still pass after the refactor (`cd server && npm test`).

---

## Task 10 — Add keyboard shortcuts

**Difficulty:** Medium–Hard | **Area:** Frontend

Add keyboard shortcuts to improve power-user workflows.

**What to do:**
1. `n` — open the "new card" input on the first list.
2. `Escape` — close any open modal.
3. `/` — focus the search bar (if you completed Task 3).
4. `?` — show a help overlay listing all shortcuts.
5. Shortcuts should only fire when no input/textarea is focused.
