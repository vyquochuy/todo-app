"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { CreateTodoSchema, Todo, TodoQueryParams, UpdateTodoSchema } from "@todo-app/shared";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import {
  createTodo,
  deleteTodo,
  fetchTodos,
  toggleTodo,
  updateTodo,
} from "../services/todo.service";

// ── Query keys factory ───────────────────────────────────────
// Centralised key factory prevents key string typos and makes
// targeted invalidation easy.

export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (params: TodoQueryParams) => [...todoKeys.lists(), params] as const,
  details: () => [...todoKeys.all, "detail"] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
};

// ── Queries ──────────────────────────────────────────────────

/**
 * Fetches a paginated, filtered list of todos.
 * The `params` object is included in the query key so any change
 * (search, filter, sort, page) automatically triggers a refetch.
 */
export function useTodos(params: TodoQueryParams = {}) {
  return useQuery({
    queryKey: todoKeys.list(params),
    queryFn: () => fetchTodos(params),
  });
}

// ── Mutations ─────────────────────────────────────────────────

/**
 * Creates a new todo with optimistic feedback via toast.
 */
export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTodoSchema) => createTodo(input),
    onSuccess: (newTodo) => {
      // Invalidate all list queries so the new item appears
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
      toast.success(`"${newTodo.title}" added`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Updates a todo. Shows success/error toasts.
 */
export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTodoSchema }) =>
      updateTodo(id, input),
    onSuccess: (updatedTodo) => {
      // Update the specific item in cache immediately
      queryClient.setQueryData(todoKeys.detail(updatedTodo.id), updatedTodo);
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
      toast.success("Task updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Toggles a todo's completion status with optimistic update.
 *
 * The UI updates instantly; if the server call fails, the previous
 * state is restored and an error toast is shown.
 */
export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleTodo(id),

    // Optimistic update — runs before the request is sent
    onMutate: async (id: string) => {
      // Cancel any in-flight refetches that could overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      // Snapshot all list caches for potential rollback
      const previousQueries = queryClient.getQueriesData<{
        items: Todo[];
      }>({ queryKey: todoKeys.lists() });

      // Optimistically flip the status in every cached list
      queryClient.setQueriesData<{ items: Todo[]; meta: unknown }>(
        { queryKey: todoKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((todo) =>
              todo.id === id
                ? {
                    ...todo,
                    status:
                      todo.status === "completed" ? "pending" : "completed",
                  }
                : todo,
            ),
          };
        },
      );

      return { previousQueries };
    },

    // Rollback on failure
    onError: (_error, _id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to update task status");
    },

    // Always refetch after settle to sync with server truth
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

/**
 * Deletes a todo with optimistic removal from the list.
 */
export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTodo(id),

    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      const previousQueries = queryClient.getQueriesData<{
        items: Todo[];
      }>({ queryKey: todoKeys.lists() });

      // Optimistically remove the item
      queryClient.setQueriesData<{ items: Todo[]; meta: unknown }>(
        { queryKey: todoKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((todo) => todo.id !== id),
          };
        },
      );

      return { previousQueries };
    },

    onError: (_error, _id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to delete task");
    },

    onSuccess: () => {
      toast.success("Task deleted");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}
