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
│   ├── schema.ts         # Drizzle ORM table definitions: users and todos tables
│   └── client.ts         # D1 client factory
├── routes/
│   ├── auth.ts           # Hono router — User registration & login handlers
│   └── todos.ts          # Hono router — Todo CRUD handlers (Protected)
├── services/
│   ├── auth.service.ts   # Edge-native hashing (PBKDF2 + random salt) & JWT token signing
│   └── todo.service.ts   # Business logic: Drizzle queries enforcing user isolation
├── middleware/
│   ├── cors.ts           # CORS with strict origin validation
│   ├── error-handler.ts  # Global error handler mapping to consistent envelopes
│   └── rate-limiter.ts   # IP-based rate limiter middleware (max 60 req/min per IP)
├── validators/
│   ├── auth.validator.ts # Zod validation middleware for register and login bodies
│   └── todo.validator.ts # Zod validation middleware for todos input and queries
├── utils/
│   └── response.ts       # successResponse(), errorResponse(), buildPaginationMeta()
└── index.ts              # Hono app entry point: middleware stacking and routes
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
ENV=development
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_jwt_signing_secret_key
```

## Architecture Notes

### Multi-Tenant Database Isolation
The `todos` table contains a non-null `user_id` pointing to the `users` table. Every query executed in `todo.service.ts` includes an explicit `eq(todos.userId, userId)` restriction. A validated JWT payload provides the `userId` context from the routing layer.

### Native Hashing on the Edge
Cloudflare Workers run in a stateless V8 isolate environment without standard Node binary capabilities. To perform secure password cryptography at the edge without heavy, slow WebAssembly wrappers:
- **Crypto Subsystem**: Password hashing leverages the native browser-equivalent Web Crypto API utilizing PBKDF2 with a random 128-bit salt per user and 100,000 iterations (using SHA-256 as the PRF).
- **Verification & Migration**: Verifying credentials parses the stored hash. If it is in the new PBKDF2 format, it recalculates the key bits and compares. If it is in the legacy format (SHA-256 + static salt), it verifies using the legacy logic and automatically upgrades the user's hash to PBKDF2 upon successful login.

### IP-Based Rate Limiting
A custom in-memory middleware (`rate-limiter.ts`) handles request throttling by caching client IP counts using Cloudflare's `CF-Connecting-IP` header. Requests exceeding 60 operations/minute return a `429 Too Many Requests` error with detailed HTTP header parameters:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
