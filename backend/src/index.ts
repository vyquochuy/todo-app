import { Hono } from "hono";
import { applyCors } from "./middleware/cors.js";
import { errorHandler } from "./middleware/error-handler.js";
import { todosRouter } from "./routes/todos.js";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// ── Middleware ───────────────────────────────────────────────
applyCors(app);
app.use("*", errorHandler);

// ── Health check ─────────────────────────────────────────────
app.get("/health", (c) =>
  c.json({ success: true, message: "OK", env: c.env.ENV }),
);

// ── Routes ───────────────────────────────────────────────────
app.route("/todos", todosRouter);

// ── 404 fallback ─────────────────────────────────────────────
app.notFound((c) =>
  c.json({ success: false, message: "Route not found" }, 404),
);

export default app;
