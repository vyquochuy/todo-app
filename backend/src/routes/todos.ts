import { Hono, type Context } from "hono";
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

const todosRouter = new Hono<{
  Bindings: CloudflareBindings;
  Variables: {
    jwtPayload: { userId: string; email: string };
  };
}>();

type TodosContext = Context<{
  Bindings: CloudflareBindings;
  Variables: {
    jwtPayload: { userId: string; email: string };
  };
}>;

// Helper to extract userId from verified JWT context
const getUserId = (c: TodosContext) => c.get("jwtPayload").userId;

// ──────────────────────────────────────────────────────────────
// GET /todos
// Query: page, pageSize, search, status, sort
// ──────────────────────────────────────────────────────────────
todosRouter.get("/", validateTodoQuery, async (c) => {
  const db = createDb(c.env.DB);
  const userId = getUserId(c);
  const query = c.req.valid("query");
  const result = await listTodos(db, userId, query);
  return c.json(successResponse(result.items, result.meta), 200);
});

// ──────────────────────────────────────────────────────────────
// GET /todos/:id
// ──────────────────────────────────────────────────────────────
todosRouter.get("/:id", async (c) => {
  const db = createDb(c.env.DB);
  const userId = getUserId(c);
  const todo = await getTodoById(db, userId, c.req.param("id"));
  return c.json(successResponse(todo), 200);
});

// ──────────────────────────────────────────────────────────────
// POST /todos
// Body: { title, description? }
// ──────────────────────────────────────────────────────────────
todosRouter.post("/", validateCreateTodo, async (c) => {
  const db = createDb(c.env.DB);
  const userId = getUserId(c);
  const body = c.req.valid("json");
  const todo = await createTodo(db, userId, body);
  return c.json(successResponse(todo), 201);
});

// ──────────────────────────────────────────────────────────────
// PUT /todos/:id
// Body: { title, description? }
// ──────────────────────────────────────────────────────────────
todosRouter.put("/:id", validateUpdateTodo, async (c) => {
  const db = createDb(c.env.DB);
  const userId = getUserId(c);
  const body = c.req.valid("json");
  const todo = await updateTodo(db, userId, c.req.param("id"), body);
  return c.json(successResponse(todo), 200);
});

// ──────────────────────────────────────────────────────────────
// PATCH /todos/:id/toggle
// ──────────────────────────────────────────────────────────────
todosRouter.patch("/:id/toggle", async (c) => {
  const db = createDb(c.env.DB);
  const userId = getUserId(c);
  const todo = await toggleTodoStatus(db, userId, c.req.param("id"));
  return c.json(successResponse(todo), 200);
});

// ──────────────────────────────────────────────────────────────
// DELETE /todos/:id
// ──────────────────────────────────────────────────────────────
todosRouter.delete("/:id", async (c) => {
  const db = createDb(c.env.DB);
  const userId = getUserId(c);
  await deleteTodo(db, userId, c.req.param("id"));
  return c.json(successResponse(null), 200);
});

export { todosRouter };
