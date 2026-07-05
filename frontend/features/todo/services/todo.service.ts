import type {
  ApiResponse,
  CreateTodoSchema,
  Todo,
  TodoQueryParams,
  UpdateTodoSchema,
} from "@todo-app/shared";
import { apiClient } from "@/lib/axios";

/**
 * Todo API service.
 *
 * All communication with the backend goes through these functions.
 * Components and hooks never call `apiClient` or `fetch` directly.
 *
 * Each function returns the unwrapped `data` field from the ApiResponse
 * envelope — callers don't need to know about the wrapper.
 */

// ── Types ────────────────────────────────────────────────────

export interface TodoListResponse {
  items: Todo[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ── Service functions ─────────────────────────────────────────

/**
 * Fetches a paginated, filtered, sorted list of todos.
 */
export async function fetchTodos(
  params: TodoQueryParams = {},
): Promise<TodoListResponse> {
  // Strip undefined values to keep the URL clean
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
  );

  const { data } = await apiClient.get<ApiResponse<Todo[]>>("/todos", {
    params: cleanParams,
  });

  return {
    items: data.data ?? [],
    meta: data.meta ?? {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    },
  };
}

/**
 * Fetches a single todo by ID.
 */
export async function fetchTodoById(id: string): Promise<Todo> {
  const { data } = await apiClient.get<ApiResponse<Todo>>(`/todos/${id}`);
  if (!data.data) throw new Error("Todo not found");
  return data.data;
}

/**
 * Creates a new todo and returns the created entity.
 */
export async function createTodo(input: CreateTodoSchema): Promise<Todo> {
  const { data } = await apiClient.post<ApiResponse<Todo>>("/todos", input);
  if (!data.data) throw new Error("Failed to create todo");
  return data.data;
}

/**
 * Updates an existing todo (full update via PUT).
 */
export async function updateTodo(
  id: string,
  input: UpdateTodoSchema,
): Promise<Todo> {
  const { data } = await apiClient.put<ApiResponse<Todo>>(
    `/todos/${id}`,
    input,
  );
  if (!data.data) throw new Error("Failed to update todo");
  return data.data;
}

/**
 * Toggles the completion status of a todo.
 */
export async function toggleTodo(id: string): Promise<Todo> {
  const { data } = await apiClient.patch<ApiResponse<Todo>>(
    `/todos/${id}/toggle`,
  );
  if (!data.data) throw new Error("Failed to toggle todo");
  return data.data;
}

/**
 * Deletes a todo by ID.
 */
export async function deleteTodo(id: string): Promise<void> {
  await apiClient.delete(`/todos/${id}`);
}
