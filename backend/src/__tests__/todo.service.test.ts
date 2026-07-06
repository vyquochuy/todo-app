import { describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import type { AppError } from "../middleware/error-handler";
import {
  createTodo,
  deleteTodo,
  getTodoById,
  listTodos,
  toggleTodoStatus,
} from "../services/todo.service";

type TodoRow = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
};

type QueryRows = Array<TodoRow | { total: number }>;

type ThenableQuery = {
  from: () => ThenableQuery;
  where: () => ThenableQuery;
  orderBy: () => ThenableQuery;
  limit: () => ThenableQuery;
  offset: () => Promise<QueryRows>;
  then: Promise<QueryRows>["then"];
};

function createQuery(rows: QueryRows): ThenableQuery {
  const query = {
    from: () => query,
    where: () => query,
    orderBy: () => query,
    limit: () => query,
    offset: () => Promise.resolve(rows),
    then: Promise.resolve(rows).then.bind(Promise.resolve(rows)),
  };
  return query;
}

function createMockDb(selectResults: QueryRows[]): Db {
  const queue = [...selectResults];
  const db = {
    select: () => createQuery(queue.shift() ?? []),
    insert: () => ({
      values: () => Promise.resolve(),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
    delete: () => ({
      where: () => Promise.resolve(),
    }),
  };

  return db as unknown as Db;
}

function todoRow(overrides: Partial<TodoRow> = {}): TodoRow {
  return {
    id: "todo-1",
    userId: "user-1",
    title: "Write tests",
    description: "Cover service behavior",
    status: false,
    createdAt: "2026-07-06T00:00:00.000Z",
    updatedAt: "2026-07-06T00:00:00.000Z",
    ...overrides,
  };
}

describe("todo service", () => {
  it("createTodo returns a pending TodoDto", async () => {
    const db = createMockDb([[todoRow()]]);

    const todo = await createTodo(db, "user-1", {
      title: "Write tests",
      description: "Cover service behavior",
    });

    expect(todo).toMatchObject({
      id: "todo-1",
      title: "Write tests",
      status: "pending",
    });
  });

  it("getTodoById throws 404 when the todo is not owned by the user", async () => {
    const db = createMockDb([[]]);

    await expect(getTodoById(db, "other-user", "todo-1")).rejects.toMatchObject({
      statusCode: 404,
    } satisfies Partial<AppError>);
  });

  it("toggleTodoStatus flips pending to completed", async () => {
    const db = createMockDb([[todoRow()], [todoRow({ status: true })]]);

    const todo = await toggleTodoStatus(db, "user-1", "todo-1");

    expect(todo.status).toBe("completed");
  });

  it("toggleTodoStatus flips completed to pending", async () => {
    const db = createMockDb([[todoRow({ status: true })], [todoRow()]]);

    const todo = await toggleTodoStatus(db, "user-1", "todo-1");

    expect(todo.status).toBe("pending");
  });

  it("deleteTodo throws 404 when the todo is not owned by the user", async () => {
    const db = createMockDb([[]]);

    await expect(deleteTodo(db, "other-user", "todo-1")).rejects.toMatchObject({
      statusCode: 404,
    } satisfies Partial<AppError>);
  });

  it("listTodos only returns rows selected for the current user", async () => {
    const db = createMockDb([
      [{ total: 1 }],
      [todoRow({ id: "owned", userId: "user-1" })],
    ]);

    const result = await listTodos(db, "user-1", {
      page: 1,
      pageSize: 10,
      status: "all",
      sort: "createdAt_desc",
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("owned");
    expect(result.meta.total).toBe(1);
  });
});
