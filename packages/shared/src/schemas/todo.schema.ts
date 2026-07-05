import { z } from "zod";

// ============================================================
// Todo mutation schemas
// ============================================================

/**
 * Schema for creating a new todo.
 * Used by:  frontend → useForm(zodResolver(createTodoSchema))
 *           backend  → validator middleware
 */
export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be at most 255 characters")
    .trim(),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .trim()
    .nullable()
    .optional(),
});

/**
 * Schema for fully updating an existing todo (PUT).
 */
export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be at most 255 characters")
    .trim(),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .trim()
    .nullable()
    .optional(),
});

// ============================================================
// Query parameter schema (GET /todos)
// ============================================================

/**
 * Schema for validating and coercing GET /todos query parameters.
 */
export const todoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["all", "pending", "completed"]).default("all"),
  sort: z
    .enum(["createdAt_desc", "createdAt_asc", "title_asc"])
    .default("createdAt_desc"),
});

// ============================================================
// Inferred types
// ============================================================

export type CreateTodoSchema = z.infer<typeof createTodoSchema>;
export type UpdateTodoSchema = z.infer<typeof updateTodoSchema>;
export type TodoQuerySchema = z.infer<typeof todoQuerySchema>;
