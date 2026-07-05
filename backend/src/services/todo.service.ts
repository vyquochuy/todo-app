import { and, asc, count, desc, eq, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { CreateTodoSchema, TodoQuerySchema, UpdateTodoSchema } from "@todo-app/shared";
import type { Db } from "../db/client.js";
import { todos } from "../db/schema.js";
import { AppError } from "../middleware/error-handler.js";
import { buildPaginationMeta } from "../utils/response.js";

// ============================================================
// Types
// ============================================================

/** Normalised Todo shape returned to consumers — decoupled from DB row */
export interface TodoDto {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface TodoListResult {
  items: TodoDto[];
  meta: ReturnType<typeof buildPaginationMeta>;
}

// ============================================================
// Helpers
// ============================================================

function toDto(row: typeof todos.$inferSelect): TodoDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status ? "completed" : "pending",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function now(): string {
  return new Date().toISOString();
}

// ============================================================
// Service functions
// ============================================================

/**
 * Returns a paginated, filtered, and sorted list of todos for a specific user.
 */
export async function listTodos(
  db: Db,
  userId: string,
  query: TodoQuerySchema,
): Promise<TodoListResult> {
  const { page, pageSize, search, status, sort } = query;
  const offset = (page - 1) * pageSize;

  // Build WHERE clauses dynamically
  const conditions = [eq(todos.userId, userId)];

  if (status !== "all") {
    conditions.push(eq(todos.status, status === "completed"));
  }

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        like(todos.title, pattern),
        like(todos.description, pattern),
      )!,
    );
  }

  const where = and(...conditions);

  // Build ORDER BY
  const orderBy =
    sort === "createdAt_asc"
      ? asc(todos.createdAt)
      : sort === "title_asc"
        ? asc(todos.title)
        : desc(todos.createdAt); // default: createdAt_desc

  // Run count + data queries in parallel
  const [countResult, rows] = await Promise.all([
    db
      .select({ total: count() })
      .from(todos)
      .where(where),
    db
      .select()
      .from(todos)
      .where(where)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset),
  ]);

  const total = countResult[0]?.total ?? 0;

  return {
    items: rows.map(toDto),
    meta: buildPaginationMeta(total, page, pageSize),
  };
}

/**
 * Returns a single todo by ID, owned by the specific user. Throws 404 if not found.
 */
export async function getTodoById(db: Db, userId: string, id: string): Promise<TodoDto> {
  const [row] = await db
    .select()
    .from(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .limit(1);

  if (!row) {
    throw new AppError(404, `Todo with id "${id}" not found`);
  }

  return toDto(row);
}

/**
 * Creates a new todo for a specific user and returns the created entity.
 */
export async function createTodo(
  db: Db,
  userId: string,
  input: CreateTodoSchema,
): Promise<TodoDto> {
  const id = nanoid();
  const timestamp = now();

  await db.insert(todos).values({
    id,
    userId,
    title: input.title,
    description: input.description ?? null,
    status: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return getTodoById(db, userId, id);
}

/**
 * Fully updates a todo. Throws 404 if the todo does not exist or isn't owned by the user.
 */
export async function updateTodo(
  db: Db,
  userId: string,
  id: string,
  input: UpdateTodoSchema,
): Promise<TodoDto> {
  // Guard: ensure the todo exists and belongs to user
  await getTodoById(db, userId, id);

  await db
    .update(todos)
    .set({
      title: input.title,
      description: input.description ?? null,
      updatedAt: now(),
    })
    .where(and(eq(todos.id, id), eq(todos.userId, userId)));

  return getTodoById(db, userId, id);
}

/**
 * Toggles the completion status of a todo.
 * Throws 404 if the todo does not exist or isn't owned by the user.
 */
export async function toggleTodoStatus(db: Db, userId: string, id: string): Promise<TodoDto> {
  const todo = await getTodoById(db, userId, id);
  const nextStatus = todo.status !== "completed";

  await db
    .update(todos)
    .set({
      status: nextStatus,
      updatedAt: now(),
    })
    .where(and(eq(todos.id, id), eq(todos.userId, userId)));

  return getTodoById(db, userId, id);
}

/**
 * Deletes a todo. Throws 404 if the todo does not exist or isn't owned by the user.
 */
export async function deleteTodo(db: Db, userId: string, id: string): Promise<void> {
  // Guard: ensure the todo exists before deleting
  await getTodoById(db, userId, id);

  await db.delete(todos).where(and(eq(todos.id, id), eq(todos.userId, userId)));
}
