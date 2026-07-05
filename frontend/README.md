# Frontend — Next.js 15

UI for the Taskflow Todo application. Built with Next.js 15, React 19, Tailwind CSS, and shadcn/ui. Deployed to Vercel.

## Quick Start

```bash
# Install dependencies (from monorepo root)
npm install

# Copy env file
cp .env.example .env.local

# Start development server
npm run dev --workspace=frontend
# App: http://localhost:3000
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout: fonts, metadata, providers
│   ├── page.tsx            # Dashboard: URL state, data fetching, rendering
│   ├── globals.css         # Design tokens (CSS variables), base styles
│   └── providers.tsx       # QueryClient, ThemeProvider, Toaster
│
├── features/todo/          # Feature-based: everything todo-related
│   ├── components/
│   │   ├── TodoCard.tsx    # Card: checkbox, title, badge, date, actions
│   │   ├── TodoList.tsx    # AnimatePresence wrapper for exit animations
│   │   ├── TodoForm.tsx    # RHF + Zod form (create & edit)
│   │   ├── TodoDialog.tsx  # Dialog wrapper for TodoForm
│   │   ├── TodoFilters.tsx # Search + status filter + sort
│   │   ├── TodoSkeleton.tsx# 4-card loading skeleton
│   │   └── TodoEmpty.tsx   # Empty + Error states
│   ├── hooks/
│   │   └── useTodos.ts     # All TanStack Query hooks in one file
│   └── services/
│       └── todo.service.ts # Axios API calls (only file that knows the API)
│
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   └── layout/
│       ├── Header.tsx      # Sticky header with dark mode toggle
│       └── Pagination.tsx  # Page numbers with ellipsis
│
├── hooks/
│   └── useDebounce.ts      # Generic debounce hook
│
└── lib/
    ├── axios.ts            # Axios instance (base URL, interceptors)
    └── utils.ts            # cn(), formatTodoDate(), getErrorMessage()
```

## Key Design Decisions

### URL State Sync
All filter state (search, status, sort, page) lives in URL search params. The page is fully bookmarkable and shareable:
```
/?search=meeting&status=completed&sort=title_asc&page=2
```

### Optimistic Updates
- **Toggle**: UI flips the checkbox immediately; rolls back if server rejects
- **Delete**: Item disappears from list immediately; rolls back on error

### Shared Validation
`TodoForm` uses `zodResolver(createTodoSchema)` imported from `@todo-app/shared` — identical to what the backend validates against.

### No fetch in components
All API calls go through `features/todo/services/todo.service.ts` → `lib/axios.ts`. Components only call hooks.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build production bundle |
| `npm run type-check` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run test` | Vitest |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base URL (no trailing slash) |
