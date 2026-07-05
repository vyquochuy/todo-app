import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * `todos` table definition.
 *
 * Notes on type choices:
 * - `id`         TEXT — nanoid() gives a compact, URL-safe unique identifier
 * - `status`     INTEGER — D1/SQLite stores booleans as 0/1
 * - `created_at` TEXT — ISO 8601 stored as text (SQLite has no native DATETIME)
 */
export const todos = sqliteTable("todos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  // 0 = pending, 1 = completed
  status: integer("status", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type TodoRow = typeof todos.$inferSelect;
export type NewTodoRow = typeof todos.$inferInsert;
