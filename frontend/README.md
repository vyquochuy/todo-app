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
│   ├── page.tsx            # Dashboard: Auth checks, URL state, rendering
│   ├── globals.css         # Design tokens (Tailwind CSS v4 CSS-first theme)
│   └── providers.tsx       # QueryClient, ThemeProvider, Toaster, SW Registration
│
├── context/
│   └── AuthContext.tsx     # Session management: JWT token state and persistence
│
├── features/
│   ├── auth/
│   │   └── components/
│   │       └── AuthForm.tsx # Login / Registration form card (glassmorphism)
│   └── todo/               # Feature-based: everything todo-related
│       ├── components/
│       │   ├── TodoCard.tsx    # Card: dropdown menu, title, badge, details
│       │   ├── TodoList.tsx    # List container with animations
│       │   ├── TodoForm.tsx    # RHF + Zod form (create & edit)
│       │   ├── TodoDialog.tsx  # Dialog wrapper for TodoForm
│       │   ├── TodoFilters.tsx # Search + status filter + sort (and w-full Add button)
│       │   ├── TodoSkeleton.tsx# 4-card loading skeleton
│       │   └── TodoEmpty.tsx   # Empty + Error states
│       ├── hooks/
│       │   └── useTodos.ts     # TanStack Query query and mutation hooks
│       └── services/
│           └── todo.service.ts # Axios API calls with custom interceptor headers
│
├── components/
│   ├── ui/                 # shadcn/ui components (select, dialog, dropdown)
│   └── layout/
│       ├── Header.tsx      # Sticky header with dark mode toggle and Logout action
│       └── Pagination.tsx  # Page numbers with ellipsis
│
├── public/
│   ├── manifest.json       # PWA Manifest configuration
│   └── sw.js               # Service Worker: cache-first logic for static assets
│
└── lib/
    ├── axios.ts            # Axios instance (base URL, request interceptors for JWT)
    └── utils.ts            # cn(), formatTodoDate(), getErrorMessage()
```

## Key Design Decisions

### Client-Side Authentication (JWT)
The user state and token are kept in a React context (`AuthContext.tsx`). The JWT token is persisted in `localStorage` and automatically loaded on startup.
- **Request Interceptor**: Inside `axios.ts`, an Axios request interceptor intercepts outgoing backend connections and inserts the token as a `Bearer` token inside the `Authorization` header.
- **Auto-Fill Evaluator Assistance**: The login form provides a 1-click button to autofill the default `test@example.com` / `password123` credentials for testing ease.

### Next.js Hydration Handling
Because the authentication state and local cache are retrieved from browser-only databases (`localStorage`), we check `mounted` state inside `page.tsx` before rendering state-dependent routes to completely prevent SSR hydration mismatch errors.

### Progressive Web App (PWA) Offline Support
- **manifest.json**: Configures Taskflow as an installable standalone app.
- **sw.js**: Standard custom service worker caches core layout files on setup. API requests (`/todos/*`, `/auth/*`) bypass the cache logic, maintaining database real-time consistency.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build production bundle |
| `npm run type-check` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run test` | Vitest |
