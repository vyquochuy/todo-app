# Taskflow — Todo List

A production-quality full-stack Todo List application built as an internship coding assessment. Demonstrates clean architecture, modern tooling, and professional UI/UX.

## Screenshots

> _Add screenshots after running the application locally._

---

## Tech Stack

| Layer    | Technology                                                |
| -------- | --------------------------------------------------------- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| State    | TanStack Query v5 (optimistic updates)                    |
| Forms    | React Hook Form + Zod                                     |
| Backend  | Hono.js, TypeScript                                       |
| Database | Cloudflare D1 (SQLite), Drizzle ORM                       |
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
│           └── schemas/todo.schema.ts  # createTodoSchema, updateTodoSchema
│
├── backend/                       # Hono.js → Cloudflare Workers + D1
│   └── src/
│       ├── db/                    # Drizzle schema + D1 client
│       ├── routes/                # Hono router (HTTP layer only)
│       ├── services/              # Business logic (calls Drizzle directly)
│       ├── middleware/            # CORS, error handler
│       ├── validators/            # @hono/zod-validator wrappers
│       └── utils/                 # Response helpers
│
└── frontend/                      # Next.js 15 → Vercel
    ├── app/                       # App Router pages + layouts
    ├── features/todo/             # Feature-based: components, hooks, services
    ├── components/                # Shared UI (shadcn/ui + layout)
    ├── hooks/                     # Generic hooks (useDebounce)
    └── lib/                       # Axios instance, utilities
```

**Key design decisions:**

- **Shared Zod schemas** — frontend and backend validate against identical rules; no drift possible
- **URL state sync** — search/filter/sort/page live in the URL; refreshing never loses state
- **Optimistic updates** — toggle and delete update the UI instantly, roll back on error
- **Feature-based frontend** — `features/todo/` groups components, hooks, and services together
- **3-layer backend** — Route → Service → Database (no repository layer; appropriate for Workers scale)

---

## Folder Structure

```
todo-app/
├── .github/workflows/ci.yml      # Lint + typecheck + test on every push
├── packages/shared/               # Shared types and schemas
├── backend/                       # API server
│   ├── drizzle/migrations/        # SQL migration files
│   ├── scripts/seed.sql           # Seed data
│   ├── src/
│   │   ├── db/schema.ts           # Drizzle table definitions
│   │   ├── services/todo.service.ts  # All business logic
│   │   ├── routes/todos.ts        # HTTP route handlers
│   │   └── ...
│   └── wrangler.toml              # Cloudflare Workers config
└── frontend/
    ├── app/page.tsx               # Dashboard (URL state, data fetching)
    ├── features/todo/
    │   ├── components/            # TodoCard, TodoForm, TodoDialog, etc.
    │   ├── hooks/useTodos.ts      # All TanStack Query hooks
    │   └── services/todo.service.ts  # Axios API calls
    └── ...
```

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

Fill in your Cloudflare credentials (only needed for `drizzle-kit` remote migrations — not for local `wrangler dev`):

```
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_d1_database_id
CLOUDFLARE_D1_TOKEN=your_d1_api_token
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

Copy the `database_id` from the output into `backend/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "todo-db"
database_id = "YOUR_DATABASE_ID_HERE"   # ← paste here
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

### Seed data (optional)

```bash
# Local
npm run db:seed:local --workspace=backend

# Remote
npm run db:seed:remote --workspace=backend
```

---

## Run Locally

### Backend (Cloudflare Workers local runtime)

```bash
npm run dev:backend
# API available at http://localhost:8787
```

### Frontend

```bash
npm run dev:frontend
# App available at http://localhost:3000
```

---

## Deploy

### Deploy backend to Cloudflare Workers

```bash
cd backend
wrangler deploy
```

The deployed URL will look like: `https://todo-app-backend.<your-subdomain>.workers.dev`

Update `CORS_ORIGIN` in `wrangler.toml` to your Vercel frontend URL.

### Deploy frontend to Vercel

1. Push the repository to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Cloudflare Workers URL
5. Deploy

---

## API Documentation

### Base URL

- Local: `http://localhost:8787`
- Production: `https://todo-app-backend.<subdomain>.workers.dev`

### Response format

All endpoints return a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 87,
    "totalPages": 9,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

Errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "title": ["Title is required"] }
}
```

### Endpoints

| Method   | Path                | Description                              |
| -------- | ------------------- | ---------------------------------------- |
| `GET`    | `/health`           | Health check                             |
| `GET`    | `/todos`            | List todos (paginated, filtered, sorted) |
| `GET`    | `/todos/:id`        | Get a single todo                        |
| `POST`   | `/todos`            | Create a todo                            |
| `PUT`    | `/todos/:id`        | Update a todo                            |
| `PATCH`  | `/todos/:id/toggle` | Toggle completion status                 |
| `DELETE` | `/todos/:id`        | Delete a todo                            |

### GET /todos — Query Parameters

| Param      | Type                                               | Default          | Description                    |
| ---------- | -------------------------------------------------- | ---------------- | ------------------------------ |
| `page`     | number                                             | `1`              | Page number                    |
| `pageSize` | number                                             | `10`             | Items per page (max 100)       |
| `search`   | string                                             | —                | Searches title and description |
| `status`   | `all` \| `pending` \| `completed`                  | `all`            | Filter by status               |
| `sort`     | `createdAt_desc` \| `createdAt_asc` \| `title_asc` | `createdAt_desc` | Sort order                     |

**Examples:**

```bash
# All todos, page 2
curl "http://localhost:8787/todos?page=2"

# Search for "shopping", completed only
curl "http://localhost:8787/todos?search=shopping&status=completed"

# Alphabetical sort
curl "http://localhost:8787/todos?sort=title_asc"
```

### POST /todos — Create

```bash
curl -X POST http://localhost:8787/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "description": "Milk, eggs, bread"}'
```

### PUT /todos/:id — Update

```bash
curl -X PUT http://localhost:8787/todos/abc123 \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries (updated)", "description": "Milk, eggs, bread, butter"}'
```

### PATCH /todos/:id/toggle — Toggle status

```bash
curl -X PATCH http://localhost:8787/todos/abc123/toggle
```

### DELETE /todos/:id

```bash
curl -X DELETE http://localhost:8787/todos/abc123
```

---

## Features

- ✅ Create, read, update, delete todos
- ✅ Toggle completion status (optimistic update)
- ✅ Search by title and description (300ms debounce)
- ✅ Filter by status (All / Pending / Completed)
- ✅ Sort by newest, oldest, alphabetical
- ✅ Pagination with rich metadata
- ✅ **URL state sync** — search/filter/sort/page preserved on refresh
- ✅ Skeleton loading states (4 cards)
- ✅ Empty state with CTA
- ✅ Error state with retry
- ✅ Dark mode (system preference + manual toggle)
- ✅ Toast notifications (add, update, delete, errors)
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Accessible (ARIA labels, focus management, keyboard navigation)
- ✅ Hover animations on cards
- ✅ Strikethrough on completed tasks

---

## Future Improvements

- Authentication (Cloudflare Access or JWT)
- Due dates and priority levels
- Drag-and-drop reordering
- Tags / categories
- Real-time updates via Cloudflare Durable Objects
- Export to CSV/JSON
- Keyboard shortcuts (⌘K command palette)
- E2E tests with Playwright
