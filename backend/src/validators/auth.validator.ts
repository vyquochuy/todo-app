import { zValidator } from "@hono/zod-validator";
import { registerSchema, loginSchema } from "@todo-app/shared";

/**
 * Validation middleware for User Registration POST /auth/register
 */
export const validateRegister = zValidator("json", registerSchema);

/**
 * Validation middleware for User Login POST /auth/login
 */
export const validateLogin = zValidator("json", loginSchema);
