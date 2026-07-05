// Re-export everything from a single entry point
// so consumers import from "@todo-app/shared" — not from sub-paths.

// Types
export type {
  Todo,
  TodoStatus,
  PaginationMeta,
  ApiResponse,
  CreateTodoInput,
  UpdateTodoInput,
  TodoQueryParams,
} from "./types/todo";

// Schemas
export {
  createTodoSchema,
  updateTodoSchema,
  todoQuerySchema,
} from "./schemas/todo.schema";

export {
  registerSchema,
  loginSchema,
} from "./schemas/user.schema";

export type {
  CreateTodoSchema,
  UpdateTodoSchema,
  TodoQuerySchema,
} from "./schemas/todo.schema";

export type {
  RegisterSchema,
  LoginSchema,
} from "./schemas/user.schema";

