import type { Context, Next } from "hono";
import { ZodError } from "zod";
import { errorResponse } from "../utils/response.js";

/**
 * Global error handler middleware.
 *
 * Intercepts all unhandled errors and maps them to consistent ApiResponse
 * envelopes with appropriate HTTP status codes.
 *
 * Error mapping:
 * - ZodError  → 422 Unprocessable Entity (validation failure)
 * - AppError  → status from the error (400/404/409/etc.)
 * - Unknown   → 500 Internal Server Error
 */
export async function errorHandler(c: Context, next: Next) {
  try {
    return await next();
  } catch (err) {
    if (err instanceof ZodError) {
      return c.json(
        errorResponse("Validation failed", err.flatten().fieldErrors),
        422,
      );
    }

    if (err instanceof AppError) {
      return c.json(errorResponse(err.message), err.statusCode as never);
    }

    console.error("[Unhandled Error]", err);
    return c.json(errorResponse("An unexpected error occurred"), 500);
  }
}

/**
 * Application-specific error class.
 * Throw this from service functions to control HTTP status codes.
 *
 * @example
 * throw new AppError(404, "Todo not found");
 * throw new AppError(409, "A todo with this title already exists");
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
