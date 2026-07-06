import { Hono } from "hono";
import { createDb } from "../db/client.js";
import { AppError } from "../middleware/error-handler.js";
import { registerUser, loginUser } from "../services/auth.service.js";
import { successResponse } from "../utils/response.js";
import { validateRegister, validateLogin } from "../validators/auth.validator.js";

const authRouter = new Hono<{ Bindings: CloudflareBindings }>();

// ──────────────────────────────────────────────────────────────
// POST /auth/register
// Body: { email, password }
// ──────────────────────────────────────────────────────────────
authRouter.post("/register", validateRegister, async (c) => {
  const db = createDb(c.env.DB);
  const body = c.req.valid("json");
  const user = await registerUser(db, body);
  return c.json(successResponse(user), 201);
});

// ──────────────────────────────────────────────────────────────
// POST /auth/login
// Body: { email, password }
// ──────────────────────────────────────────────────────────────
authRouter.post("/login", validateLogin, async (c) => {
  const db = createDb(c.env.DB);
  const body = c.req.valid("json");

  const jwtSecret = c.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError(500, "JWT_SECRET is not configured");
  }

  const result = await loginUser(db, body, jwtSecret);

  return c.json(successResponse(result), 200);
});

export { authRouter };
