"use client";

import { Search, SlidersHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────

export type StatusFilter = "all" | "pending" | "completed";
export type SortOption = "createdAt_desc" | "createdAt_asc" | "title_asc";

export interface FilterState {
  search: string;
  status: StatusFilter;
  sort: SortOption;
}

interface TodoFiltersProps {
  filters: FilterState;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onSortChange: (value: SortOption) => void;
  onAddClick: () => void;
}

// ── Component ─────────────────────────────────────────────────

/**
 * Filter bar: search input + status filter + sort dropdown + add task button.
 */
export function TodoFilters({
  filters,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onAddClick,
}: TodoFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="todo-search"
          type="search"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          aria-label="Search tasks"
        />
      </div>

      <div className="flex w-full gap-2 sm:w-auto">
        {/* Status filter */}
        <Select
          value={filters.status}
          onValueChange={(v) => onStatusChange(v as StatusFilter)}
        >
          <SelectTrigger
            id="status-filter"
            className="flex-1 w-0 sm:w-[130px] sm:flex-none"
            aria-label="Filter by status"
          >
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={filters.sort}
          onValueChange={(v) => onSortChange(v as SortOption)}
        >
          <SelectTrigger
            id="sort-select"
            className="flex-1 w-0 sm:w-[140px] sm:flex-none"
            aria-label="Sort tasks"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt_desc">Newest</SelectItem>
            <SelectItem value="createdAt_asc">Oldest</SelectItem>
            <SelectItem value="title_asc">A → Z</SelectItem>
          </SelectContent>
        </Select>

        {/* Add task button */}
        <Button
          id="add-task-button"
          onClick={onAddClick}
          className="flex-1 w-0 sm:w-auto sm:flex-none gap-2"
        >
          <Plus className="h-4 w-4" />
          Add task
        </Button>
      </div>
    </div>
  );
}

