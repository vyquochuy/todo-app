-- Seed data for local development and demonstration
-- Run with: npm run db:seed:local

DELETE FROM todos;

INSERT INTO todos (id, title, description, status, created_at, updated_at) VALUES
    ('seed_01', 'Design system architecture',       'Plan the monorepo structure and tech stack selection', 1, datetime('now', '-7 days'), datetime('now', '-7 days')),
    ('seed_02', 'Set up Cloudflare D1 database',    'Create D1 instance and run initial migration',         1, datetime('now', '-6 days'), datetime('now', '-6 days')),
    ('seed_03', 'Implement Hono.js REST API',        'CRUD endpoints with Zod validation and clean architecture', 1, datetime('now', '-5 days'), datetime('now', '-5 days')),
    ('seed_04', 'Build Next.js frontend',            'App Router, TanStack Query, shadcn/ui components',    0, datetime('now', '-4 days'), datetime('now', '-4 days')),
    ('seed_05', 'Add authentication',                'Implement JWT auth or Cloudflare Access',             0, datetime('now', '-3 days'), datetime('now', '-3 days')),
    ('seed_06', 'Write unit tests',                  'Service layer tests with Vitest',                     0, datetime('now', '-2 days'), datetime('now', '-2 days')),
    ('seed_07', 'Configure GitHub Actions CI',       'Lint, typecheck, test on every push',                 0, datetime('now', '-1 days'), datetime('now', '-1 days')),
    ('seed_08', 'Deploy backend to Cloudflare',      'wrangler deploy and verify health endpoint',          0, datetime('now'),            datetime('now')),
    ('seed_09', 'Deploy frontend to Vercel',         'Connect GitHub repo and set environment variables',   0, datetime('now'),            datetime('now')),
    ('seed_10', 'Write comprehensive README',        'Installation, env setup, API docs, screenshots',      0, datetime('now'),            datetime('now'));
