"use client";

import type { Todo } from "@todo-app/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Pagination } from "@/components/layout/Pagination";
import { Button } from "@/components/ui/button";
import { TodoDialog } from "@/features/todo/components/TodoDialog";
import { TodoEmpty, TodoError } from "@/features/todo/components/TodoEmpty";
import {
  TodoFilters,
  type FilterState,
  type SortOption,
  type StatusFilter,
} from "@/features/todo/components/TodoFilters";
import { TodoList } from "@/features/todo/components/TodoList";
import { TodoSkeleton } from "@/features/todo/components/TodoSkeleton";
import { useTodos } from "@/features/todo/hooks/useTodos";
import { useDebounce } from "@/hooks/useDebounce";

const PAGE_SIZE = 10;

/**
 * Dashboard page — the main application view.
 *
 * URL state sync: search, status, sort, and page are all stored as
 * search params so refreshing or sharing the URL preserves state.
 *
 * /?search=meeting&status=completed&sort=createdAt_desc&page=2
 */
import { Suspense } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AuthForm } from "@/features/auth/components/AuthForm";

function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Read state from URL ──────────────────────────────────────
  const searchInput = searchParams.get("search") ?? "";
  const status = (searchParams.get("status") as StatusFilter) ?? "all";
  const sort = (searchParams.get("sort") as SortOption) ?? "createdAt_desc";
  const page = Number(searchParams.get("page") ?? "1");

  // Local state for the uncontrolled search input — debounced before URL sync
  const [localSearch, setLocalSearch] = useState(searchInput);
  const debouncedSearch = useDebounce(localSearch, 300);

  // ── Dialog state ─────────────────────────────────────────────
  const [dialogState, setDialogState] = useState<
    | { open: false }
    | { open: true; mode: "create" }
    | { open: true; mode: "edit"; todo: Todo }
  >({ open: false });

  // ── URL helpers ───────────────────────────────────────────────
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // ── Event handlers ────────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    updateParams({ search: value, page: undefined });
  };

  const handleStatusChange = (value: StatusFilter) => {
    updateParams({ status: value, page: undefined });
  };

  const handleSortChange = (value: SortOption) => {
    updateParams({ sort: value, page: undefined });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditClick = (todo: Todo) => {
    setDialogState({ open: true, mode: "edit", todo });
  };

  const handleAddClick = () => {
    setDialogState({ open: true, mode: "create" });
  };

  // ── Data fetching ─────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useTodos({
    search: debouncedSearch || undefined,
    status: status === "all" ? undefined : status,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });

  const todos = data?.items ?? [];
  const meta = data?.meta;
  const isFiltered = !!debouncedSearch || status !== "all";

  // ── Filter state object for TodoFilters ───────────────────────
  const filters: FilterState = {
    search: localSearch,
    status,
    sort,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
          {meta && (
            <p className="mt-1 text-sm text-muted-foreground">
              {meta.total} {meta.total === 1 ? "task" : "tasks"} total
            </p>
          )}
        </div>

        {/* Toolbar: filters (including add task button) */}
        <div className="mb-6">
          <TodoFilters
            filters={filters}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onSortChange={handleSortChange}
            onAddClick={handleAddClick}
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <TodoSkeleton count={4} />
        ) : isError ? (
          <TodoError onRetry={() => refetch()} />
        ) : todos.length === 0 ? (
          <TodoEmpty isFiltered={isFiltered} onAddClick={handleAddClick} />
        ) : (
          <>
            <TodoList todos={todos} onEditClick={handleEditClick} />

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  hasNext={meta.hasNext}
                  hasPrevious={meta.hasPrevious}
                  onPageChange={handlePageChange}
                />
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Showing {(meta.page - 1) * meta.pageSize + 1}–
                  {Math.min(meta.page * meta.pageSize, meta.total)} of{" "}
                  {meta.total} tasks
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Create dialog */}
      {dialogState.open && dialogState.mode === "create" && (
        <TodoDialog
          mode="create"
          open={dialogState.open}
          onOpenChange={(open) =>
            setDialogState(open ? { open: true, mode: "create" } : { open: false })
          }
        />
      )}

      {/* Edit dialog */}
      {dialogState.open && dialogState.mode === "edit" && (
        <TodoDialog
          mode="edit"
          todo={dialogState.todo}
          open={dialogState.open}
          onOpenChange={(open) =>
            setDialogState(
              open
                ? { open: true, mode: "edit", todo: dialogState.todo }
                : { open: false },
            )
          }
        />
      )}
    </div>
  );
}

function DashboardContent() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-4xl px-4 py-8 sm:px-6">
          <TodoSkeleton count={4} />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return <Dashboard />;
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-4xl px-4 py-8 sm:px-6">
              <TodoSkeleton count={4} />
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </AuthProvider>
  );
}

