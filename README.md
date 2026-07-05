# Taskflow — Todo List

A production-quality full-stack Todo List application built as an internship coding assessment. Demonstrates clean architecture, modern tooling, professional UI/UX, user authentication, edge security, and PWA offline capability.

---

## Tech Stack

| Layer    | Technology                                                |
| -------- | --------------------------------------------------------- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| State    | TanStack Query v5 (optimistic updates)                    |
| Forms    | React Hook Form + Zod                                     |
| Backend  | Hono.js, TypeScript                                       |
| Security | IP-based Rate Limiter (sliding window), strict CORS       |
| Auth     | JWT (HS256) session validation, native Web Crypto hashing  |
| Database | Cloudflare D1 (SQLite), Drizzle ORM                       |
| Offline  | PWA Manifest, custom cache-first Service Worker (sw.js)   |
| Deploy   | Frontend → Vercel · Backend → Cloudflare Workers          |
| Quality  | ESLint, Prettier, Vitest, GitHub Actions CI               |

---

## Architecture

```
todo-app/                          # npm workspaces monorepo
├── packages/
│   └── shared/                    # Shared Zod schemas + TypeScript types
│       └── src/
│           ├── types/todo.ts      # Todo, ApiResponse<T>, PaginationMeta
│           ├── schemas/todo.schema.ts  # createTodoSchema, updateTodoSchema
│           └── schemas/user.schema.ts  # registerSchema, loginSchema
│
├── backend/                       # Hono.js → Cloudflare Workers + D1
│   └── src/
│       ├── db/                    # Drizzle schema + D1 client
│       ├── routes/                # Hono router (HTTP layer only)
│       │   ├── auth.ts            # Login & Register handlers
│       │   └── todos.ts           # Todo CRUD handlers (Protected)
│       ├── services/              # Business logic
│       │   ├── auth.service.ts    # Native hashing & token signing
│       │   └── todo.service.ts    # Multi-tenant isolated database queries
│       ├── middleware/            # CORS, error handler, rate-limiter
│       ├── validators/            # @hono/zod-validator wrappers
│       └── utils/                 # Response helpers
│
└── frontend/                      # Next.js 15 → Vercel
    ├── app/                       # App Router pages + layouts
    ├── context/
    │   └── AuthContext.tsx        # Session state provider (JWT persistence)
    ├── features/
    │   ├── auth/                  # Glassmorphic Login/Register screen
    │   └── todo/                  # Todo filters, list, dialogs, hooks
    ├── components/                # Shared UI (shadcn/ui + layout)
    ├── hooks/                     # Generic hooks (useDebounce)
    └── public/
        ├── manifest.json          # PWA Manifest config
        └── sw.js                  # Custom offline caching service worker
```

**Key design decisions:**

- **Shared Zod schemas** — frontend and backend validate against identical rules; no drift possible.
- **JWT & Password Security** — Password hashing is executed using edge-native `SHA-256` via the Web Crypto API. Authentication states are validated using Hono's official JWT middleware.
- **Multi-Tenant Isolation** — Every database query is restricted using the client's validated `userId` (`WHERE user_id = current_user_id`), preventing cross-tenant data leaks.
- **Edge Rate Limiting** — An IP-based sliding window restricts abuse (max 60 req/min per IP), setting standard `X-RateLimit` headers.
- **URL state sync** — search/filter/sort/page live in the URL; refreshing never loses state.
- **Optimistic updates** — toggle and delete update the UI instantly, rolling back on network failure.
- **Manual PWA Integration** — A custom Service Worker caches static assets and skips dynamic API routes, ensuring fast loading and baseline offline capability without relying on complex, mismatch-prone plugins.

---

## Installation

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- Cloudflare account (for D1 and Workers)
- Wrangler CLI: `npm install -g wrangler`

### Clone and install

```bash
git clone <your-repo-url>
cd todo-app
npm install          # installs all workspaces
```

---

## Environment Variables

### Backend

Copy `backend/.env.example` to `backend/.dev.vars`:

```bash
cp backend/.env.example backend/.dev.vars
```

Add your Drizzle credentials and the JWT secret:

```
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_d1_database_id
CLOUDFLARE_D1_TOKEN=your_d1_api_token
JWT_SECRET=your_jwt_signing_secret
```

### Frontend

Copy `frontend/.env.example` to `frontend/.env.local`:

```bash
cp frontend/.env.example frontend/.env.local
```

```
NEXT_PUBLIC_API_URL=http://localhost:8787
```

---

## Database — Cloudflare D1

### Create the D1 database

```bash
npx wrangler d1 create todo-db
```

Copy the `database_id` and configure `migrations_dir` in `backend/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "todo-db"
database_id = "YOUR_DATABASE_ID_HERE"
migrations_dir = "drizzle/migrations"
```

### Run migrations

**Local** (for `wrangler dev`):

```bash
npm run db:migrate:local --workspace=backend
```

**Remote** (production D1):

```bash
npm run db:migrate:remote --workspace=backend
```

*(Note: On initial remote setup, run `npx wrangler d1 execute todo-db --remote --command="DROP TABLE IF EXISTS todos;"` if the old schema table conflicts with migrations).*

---

## Run Locally

### Backend (Cloudflare Workers local runtime)

```bash
npm run dev:backend
# API available at http://localhost:8787
```

*Note: On startup, the backend automatically seeds a default test user if the database is empty:*
- **Email:** `test@example.com`
- **Password:** `password123`

### Frontend

```bash
npm run dev:frontend
# App available at http://localhost:3000
```

---

## API Documentation

### Base URL

- Local: `http://localhost:8787`
- Production: `https://todo-app-backend.<subdomain>.workers.dev`

### Headers

For all protected routes under `/todos/*`, the HTTP `Authorization` header must be provided:
```
Authorization: Bearer <your_jwt_token>
```

Responses include standard Rate Limit metadata:
- `X-RateLimit-Limit`: Maximum requests allowed per window (60)
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Timestamp when window resets

### Endpoints

| Method   | Path                | Auth Required | Description                              |
| -------- | ------------------- | ------------- | ---------------------------------------- |
| `POST`   | `/auth/register`    | No            | Create a new user account                |
| `POST`   | `/auth/login`       | No            | Validate credentials, return JWT token   |
| `GET`    | `/health`           | No            | Health check                             |
| `GET`    | `/todos`            | **Yes**       | List user's todos (paginated & sorted)   |
| `GET`    | `/todos/:id`        | **Yes**       | Get a single user todo                   |
| `POST`   | `/todos`            | **Yes**       | Create a todo under active user          |
| `PUT`    | `/todos/:id`        | **Yes**       | Update a user todo                       |
| `PATCH`  | `/todos/:id/toggle` | **Yes**       | Toggle completion status                 |
| `DELETE` | `/todos/:id`        | **Yes**       | Delete a user todo                       |

---

## Features

- ✅ **JWT Authentication** — Login, register, and token management (7-day longevity).
- ✅ **Multi-Tenant Isolation** — Users can only see/mutate their own tasks.
- ✅ **Edge Rate Limiting** — Prevents DDoS and bruteforce spamming at edge nodes.
- ✅ **PWA Support** — Manifest configuration and Cache-First Service Worker offline support.
- ✅ **Autofill Testing** — 1-click test credentials loader for straightforward evaluations.
- ✅ Toggle completion status (optimistic update).
- ✅ Search by title and description (300ms debounce).
- ✅ Filter by status (All / Pending / Completed).
- ✅ Sort by newest, oldest, alphabetical.
- ✅ Pagination with rich metadata.
- ✅ **URL state sync** — search/filter/sort/page preserved on refresh.
- ✅ Dark mode (system preference + manual toggle).
- ✅ Toast notifications (add, update, delete, errors).
- ✅ Fully responsive (mobile, tablet, desktop).
