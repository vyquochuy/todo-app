import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { count } from "drizzle-orm";
import { createDb, type Db } from "./db/client.js";
import { users } from "./db/schema.js";
import { hashPassword } from "./services/auth.service.js";
import { applyCors } from "./middleware/cors.js";
import { AppError, errorHandler } from "./middleware/error-handler.js";
import { rateLimiter } from "./middleware/rate-limiter.js";
import { authRouter } from "./routes/auth.js";
import { todosRouter } from "./routes/todos.js";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Cache to prevent repetitive database seeding queries
let isSeeded = false;

async function seedTestUser(db: Db, env: string) {
  if (env !== "development") return;
  if (isSeeded) return;
  try {
    const [userCount] = await db.select({ total: count() }).from(users);
    if ((userCount?.total ?? 0) === 0) {
      const testId = "test-user-id-9999";
      const email = "test@example.com";
      const passwordHash = await hashPassword("password123");
      const timestamp = new Date().toISOString();

      await db.insert(users).values({
        id: testId,
        email,
        passwordHash,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    isSeeded = true;
  } catch (err) {
    console.error("Failed to seed default test user:", err);
  }
}

// ── Middleware ───────────────────────────────────────────────
applyCors(app);
app.use("*", rateLimiter); // Apply custom IP rate limiter to all requests
app.use("*", errorHandler);

// Global middleware to check/seed test user on first startup
app.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  await seedTestUser(db, c.env.ENV);
  await next();
});

// ── Health check ─────────────────────────────────────────────
app.get("/health", (c) =>
  c.json({ success: true, message: "OK", env: c.env.ENV }),
);

// ── Routes ───────────────────────────────────────────────────

// Auth routes (public)
app.route("/auth", authRouter);

// Apply JWT verification middleware to secure all todo endpoints
app.use("/todos/*", async (c, next) => {
  const secret = c.env.JWT_SECRET;
  if (!secret) {
    throw new AppError(500, "JWT_SECRET is not configured");
  }
  const middleware = jwt({ secret, alg: "HS256" });
  return middleware(c, next);
});

// Todo routes (protected)
app.route("/todos", todosRouter);

// ── 404 fallback ─────────────────────────────────────────────
app.notFound((c) =>
  c.json({ success: false, message: "Route not found" }, 404),
);

export default app;
