// ============================================================
// Core domain types
// ============================================================

/**
 * Represents the completion status of a todo item.
 */
export type TodoStatus = "pending" | "completed";

/**
 * A single todo item as returned from the API.
 */
export interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ============================================================
// API response envelope
// ============================================================

/**
 * Pagination metadata included on list endpoints.
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Standard API response wrapper used by every endpoint.
 *
 * @example
 * // Success (single resource)
 * { success: true, data: todo }
 *
 * @example
 * // Success (list)
 * { success: true, data: todos, meta: { page, pageSize, total, ... } }
 *
 * @example
 * // Error
 * { success: false, message: "Not found", errors: ... }
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: unknown;
}

// ============================================================
// Request payload types (derived from Zod schemas)
// ============================================================

export interface CreateTodoInput {
  title: string;
  description?: string | null;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string | null;
}

export interface TodoQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "all" | TodoStatus;
  sort?: "createdAt_desc" | "createdAt_asc" | "title_asc";
}
