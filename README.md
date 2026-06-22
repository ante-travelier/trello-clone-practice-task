# Trello Clone

A full-stack Trello clone featuring boards, lists, cards with drag-and-drop reordering, labels, checklists, due dates, and JWT-based authentication with automatic token refresh. Built as a portfolio project to demonstrate modern full-stack JavaScript development.

## Tech Stack

| Layer            | Technology                                       |
| ---------------- | ------------------------------------------------ |
| Frontend         | React 18, Vite 5, Tailwind CSS 3, React Router 6 |
| Drag & Drop      | @hello-pangea/dnd                                |
| HTTP Client      | Axios (with interceptors for token refresh)      |
| Backend          | Node.js, Express 4                               |
| Database         | PostgreSQL                                       |
| ORM              | Prisma                                           |
| Authentication   | JWT (access + refresh tokens), bcryptjs          |
| Validation       | Zod                                              |
| Testing (server) | Jest, Supertest                                  |
| Testing (client) | Vitest, React Testing Library                    |
| Testing (E2E)    | Playwright                                       |

## Project Structure

```
trello-clone/
├── client/                     # React single-page application
│   ├── src/
│   │   ├── api/                # Axios HTTP clients
│   │   │   ├── auth.js         #   Auth endpoints (register, login, logout, refresh)
│   │   │   ├── axios.js        #   Axios instance with token interceptors
│   │   │   ├── boards.js       #   Board CRUD endpoints
│   │   │   ├── cards.js        #   Card CRUD endpoints
│   │   │   ├── cardDetails.js  #   Labels, checklists, and items endpoints
│   │   │   └── lists.js        #   List CRUD endpoints
│   │   ├── components/         # Reusable UI components
│   │   │   ├── CardModal.jsx   #   Card detail modal (title, desc, due date, labels, checklists)
│   │   │   ├── CardTile.jsx    #   Card preview tile in list column
│   │   │   ├── DueDateBadge.jsx#   Color-coded due date badge
│   │   │   ├── Header.jsx      #   Top navigation bar with user menu
│   │   │   └── ListColumn.jsx  #   Draggable list column with cards
│   │   ├── context/
│   │   │   └── AuthContext.jsx  #  Auth state provider (user, tokens)
│   │   ├── hooks/
│   │   │   └── useAuth.js       #  Hook for accessing auth context
│   │   ├── pages/
│   │   │   ├── BoardsPage.jsx   #  Dashboard with board grid
│   │   │   ├── BoardView.jsx    #  Board detail with lists and drag-and-drop
│   │   │   ├── LoginPage.jsx    #  Login form
│   │   │   └── RegisterPage.jsx #  Registration form
│   │   ├── __tests__/           #  Vitest unit and component tests
│   │   ├── App.jsx              #  Route definitions
│   │   ├── main.jsx             #  Entry point
│   │   └── index.css            #  Tailwind directives
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── server/                     # Express REST API
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── boardController.js
│   │   │   ├── cardController.js
│   │   │   ├── cardDetailController.js
│   │   │   └── listController.js
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.js         #   JWT verification
│   │   │   └── errorHandler.js #   Global error handler
│   │   ├── prisma/
│   │   │   ├── schema.prisma   #   Database schema (7 models)
│   │   │   └── client.js       #   Prisma client instance
│   │   ├── routes/             # Express routers
│   │   │   ├── auth.js
│   │   │   ├── boards.js
│   │   │   ├── cards.js
│   │   │   ├── cardDetails.js
│   │   │   └── lists.js
│   │   ├── __tests__/          # Jest integration tests
│   │   └── index.js            # Server entry point
│   ├── jest.config.js
│   └── package.json
├── e2e/                        # Playwright end-to-end tests
│   ├── tests/
│   │   ├── auth.spec.ts
│   │   ├── boards.spec.ts
│   │   ├── card-detail.spec.ts
│   │   └── lists-cards.spec.ts
│   ├── fixtures/
│   │   └── test-helpers.ts
│   ├── playwright.config.ts
│   └── package.json
├── docs/features/              # Feature documentation
│   ├── index.md
│   ├── architecture.md
│   ├── auth.md
│   ├── boards.md
│   ├── cards.md
│   └── drag-and-drop.md
├── CLAUDE.md                   # AI assistant context
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL (local install or Docker)

### 1. Clone the repository

```bash
git clone <repository-url>
cd trello-clone
```

### 2. Set up the database

Start PostgreSQL locally or via Docker:

```bash
docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

### 3. Configure environment variables

Create a `.env` file in the `server/` directory:

```bash
cp server/.env.example server/.env
```

Fill in the required values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trello_clone"
JWT_SECRET="your-access-token-secret"
JWT_REFRESH_SECRET="your-refresh-token-secret"
CLIENT_URL="http://localhost:5173"
PORT=4000
```

### 4. Install dependencies and set up the database

```bash
# Server
cd server
npm install
npx prisma migrate dev --name init
cd ..

# Client
cd client
npm install
cd ..

# E2E tests (optional)
cd e2e
npm install
npx playwright install
cd ..
```

### 5. Start the development servers

In two separate terminals:

```bash
# Terminal 1 - API server
cd server
npm run dev

# Terminal 2 - React client
cd client
npm run dev
```

The client will be available at `http://localhost:5173` and the API at `http://localhost:4000`.

### Verify (agents & CI)

After setup, run the full verification pipeline from the repo root:

```bash
npm run setup   # installs all workspace dependencies
npm run verify  # lint → format:check → migrate → server tests (+coverage) → client tests (+coverage) → client build → e2e
```

`npm run verify` spins up an ephemeral Postgres on port 55433 (via `docker-compose.yml`), runs
every check against it, and tears it down on exit. All destructive test operations are code-enforced
to stay on that ephemeral DB — see `server/src/lib/assertTestDatabase.js`.

A devcontainer / devbox is also available for fully isolated runs:

```bash
docker build -t trello-clone-devbox .  # build the devbox image
# or open in VS Code → "Reopen in Container" (.devcontainer/)
```

## Available Scripts

### Server (`cd server`)

| Script                   | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `npm run dev`            | Start the API server with nodemon (auto-reload) |
| `npm start`              | Start the API server (production)               |
| `npm test`               | Run Jest integration tests                      |
| `npx prisma studio`      | Open Prisma Studio (database GUI)               |
| `npx prisma migrate dev` | Run database migrations                         |

### Client (`cd client`)

| Script            | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR  |
| `npm run build`   | Build for production                |
| `npm run preview` | Preview the production build        |
| `npm test`        | Run Vitest unit and component tests |

### E2E Tests (`cd e2e`)

| Script                | Description                         |
| --------------------- | ----------------------------------- |
| `npm test`            | Run Playwright E2E tests (headless) |
| `npm run test:headed` | Run E2E tests in a visible browser  |
| `npm run report`      | Open the HTML test report           |

## Environment Variables

### Server (`server/.env`)

| Variable             | Description                       | Example                                                      |
| -------------------- | --------------------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`       | PostgreSQL connection string      | `postgresql://postgres:postgres@localhost:5432/trello_clone` |
| `JWT_SECRET`         | Secret for signing access tokens  | Any long random string                                       |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | Any long random string (different from above)                |
| `CLIENT_URL`         | Allowed CORS origin               | `http://localhost:5173`                                      |
| `PORT`               | Server port                       | `4000`                                                       |

### Client (`client/.env`)

The Vite client reads:

| Variable       | Description               | Example                     |
| -------------- | ------------------------- | --------------------------- |
| `VITE_API_URL` | Base URL for API requests | `http://localhost:4000/api` |

## Architecture Overview

The application follows a standard client-server architecture:

- **Client**: React SPA with Vite, communicating with the server via Axios. Authentication state is managed through React Context. Access tokens are stored in memory (not localStorage) to prevent XSS attacks. Refresh tokens are stored in httpOnly cookies.

- **Server**: Express REST API with Prisma ORM. All routes under `/api/boards`, `/api/lists`, `/api/cards` are protected by JWT middleware. Input validation uses Zod schemas.

- **Database**: PostgreSQL with 7 tables (User, Board, List, Card, Label, Checklist, ChecklistItem). Cascading deletes ensure referential integrity.

- **Drag and Drop**: Uses @hello-pangea/dnd with float-based positioning to avoid full re-indexing on every reorder operation. Updates are applied optimistically with rollback on failure.

For detailed documentation, see the [docs/features/](./docs/features/index.md) directory.

## License

MIT
