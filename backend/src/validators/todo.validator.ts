import { zValidator } from "@hono/zod-validator";
import {
  createTodoSchema,
  todoQuerySchema,
  updateTodoSchema,
} from "@todo-app/shared";

/**
 * Validation middleware for POST /todos — validates the request body.
 */
export const validateCreateTodo = zValidator("json", createTodoSchema);

/**
 * Validation middleware for PUT /todos/:id — validates the request body.
 */
export const validateUpdateTodo = zValidator("json", updateTodoSchema);

/**
 * Validation middleware for GET /todos — validates and coerces query params.
 */
export const validateTodoQuery = zValidator("query", todoQuerySchema);
