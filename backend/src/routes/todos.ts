import { Hono } from "hono";
import { createDb } from "../db/client.js";
import {
  createTodo,
  deleteTodo,
  getTodoById,
  listTodos,
  toggleTodoStatus,
  updateTodo,
} from "../services/todo.service.js";
import { successResponse } from "../utils/response.js";
import {
  validateCreateTodo,
  validateTodoQuery,
  validateUpdateTodo,
} from "../validators/todo.validator.js";

const todosRouter = new Hono<{ Bindings: CloudflareBindings }>();

// ──────────────────────────────────────────────────────────────
// GET /todos
// Query: page, pageSize, search, status, sort
// ──────────────────────────────────────────────────────────────
todosRouter.get("/", validateTodoQuery, async (c) => {
  const db = createDb(c.env.DB);
  const query = c.req.valid("query");
  const result = await listTodos(db, query);
  return c.json(successResponse(result.items, result.meta), 200);
});

// ──────────────────────────────────────────────────────────────
// GET /todos/:id
// ──────────────────────────────────────────────────────────────
todosRouter.get("/:id", async (c) => {
  const db = createDb(c.env.DB);
  const todo = await getTodoById(db, c.req.param("id"));
  return c.json(successResponse(todo), 200);
});

// ──────────────────────────────────────────────────────────────
// POST /todos
// Body: { title, description? }
// ──────────────────────────────────────────────────────────────
todosRouter.post("/", validateCreateTodo, async (c) => {
  const db = createDb(c.env.DB);
  const body = c.req.valid("json");
  const todo = await createTodo(db, body);
  return c.json(successResponse(todo), 201);
});

// ──────────────────────────────────────────────────────────────
// PUT /todos/:id
// Body: { title, description? }
// ──────────────────────────────────────────────────────────────
todosRouter.put("/:id", validateUpdateTodo, async (c) => {
  const db = createDb(c.env.DB);
  const body = c.req.valid("json");
  const todo = await updateTodo(db, c.req.param("id"), body);
  return c.json(successResponse(todo), 200);
});

// ──────────────────────────────────────────────────────────────
// PATCH /todos/:id/toggle
// ──────────────────────────────────────────────────────────────
todosRouter.patch("/:id/toggle", async (c) => {
  const db = createDb(c.env.DB);
  const todo = await toggleTodoStatus(db, c.req.param("id"));
  return c.json(successResponse(todo), 200);
});

// ──────────────────────────────────────────────────────────────
// DELETE /todos/:id
// ──────────────────────────────────────────────────────────────
todosRouter.delete("/:id", async (c) => {
  const db = createDb(c.env.DB);
  await deleteTodo(db, c.req.param("id"));
  return c.json(successResponse(null), 200);
});

export { todosRouter };
