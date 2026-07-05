"use client";

import { AlertCircle, RefreshCw, ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Empty State ───────────────────────────────────────────────

interface TodoEmptyProps {
  isFiltered?: boolean; // true when search/filter is active
  onAddClick: () => void;
}

/**
 * Empty state displayed when there are no todos.
 *
 * Two variants:
 * - Default: no todos exist yet → show "Create your first task" CTA
 * - Filtered: search/filter returned no results → show "No results" message
 */
export function TodoEmpty({ isFiltered = false, onAddClick }: TodoEmptyProps) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <ClipboardList className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold">No results found</h3>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
          Try adjusting your search or filters to find what you&apos;re looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      {/* Illustration */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <ClipboardList className="h-8 w-8 text-primary" />
      </div>

      <h3 className="text-lg font-semibold">Nothing here yet</h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Create your first task and start staying organised.
      </p>

      <Button id="empty-add-task" onClick={onAddClick} className="mt-6 gap-2">
        <Plus className="h-4 w-4" />
        Add your first task
      </Button>
    </div>
  );
}

// ── Error State ───────────────────────────────────────────────

interface TodoErrorProps {
  onRetry: () => void;
}

/**
 * Error state displayed when the API call fails.
 */
export function TodoError({ onRetry }: TodoErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <h3 className="text-base font-semibold">Unable to load tasks</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        Something went wrong while fetching your tasks. Please try again.
      </p>
      <Button
        id="error-retry"
        variant="outline"
        onClick={onRetry}
        className="mt-6 gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}
