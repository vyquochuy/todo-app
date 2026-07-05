# Backend — Hono.js API

REST API for the Taskflow Todo application. Built with Hono.js, deployed to Cloudflare Workers, and backed by Cloudflare D1.

## Quick Start

```bash
# Install dependencies (from monorepo root)
npm install

# Start local development server
npm run dev --workspace=backend
# API: http://localhost:8787
```

## Project Structure

```
backend/src/
├── db/
│   ├── schema.ts         # Drizzle ORM table definitions
│   └── client.ts         # D1 client factory
├── routes/
│   └── todos.ts          # Hono router — HTTP layer only
├── services/
│   └── todo.service.ts   # Business logic, Drizzle queries
├── middleware/
│   ├── cors.ts           # CORS with per-environment origin
│   └── error-handler.ts  # Global error → ApiResponse mapper
├── validators/
│   └── todo.validator.ts # @hono/zod-validator wrappers (shared schemas)
├── utils/
│   └── response.ts       # successResponse(), errorResponse(), buildPaginationMeta()
└── index.ts              # Hono app entry point
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start local dev with `wrangler dev` |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run type-check` | Run TypeScript compiler check |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:migrate:local` | Apply migrations to local D1 |
| `npm run db:migrate:remote` | Apply migrations to production D1 |
| `npm run db:seed:local` | Seed local D1 database |
| `npm run test` | Run Vitest tests |

## Environment Variables

Set in `wrangler.toml` under `[vars]`. For local dev, create `.dev.vars`:

```
CLOUDFLARE_ACCOUNT_ID=...  # for drizzle-kit only
CLOUDFLARE_DATABASE_ID=... # for drizzle-kit only
CLOUDFLARE_D1_TOKEN=...    # for drizzle-kit only
ENV=development
CORS_ORIGIN=http://localhost:3000
```

## Architecture Notes

- **No repository layer** — Service calls Drizzle directly. Appropriate for Cloudflare Workers' stateless, lightweight execution model.
- **Shared validation** — Validators import from `@todo-app/shared`, ensuring identical rules on frontend and backend.
- **Per-request DB client** — `createDb(c.env.DB)` is called in each handler. Workers are stateless; no connection pooling needed.
- **Error flow** — Services throw `AppError(statusCode, message)`. The `errorHandler` middleware catches all errors and maps them to consistent `ApiResponse` envelopes.
