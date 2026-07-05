import type { Hono } from "hono";
import { cors } from "hono/cors";

/**
 * Attaches CORS middleware to the Hono app.
 *
 * The allowed origin is read from the CORS_ORIGIN environment variable
 * (set per-environment in wrangler.toml), so local dev uses localhost:3000
 * and production uses the Vercel frontend URL.
 */
export function applyCors(app: Hono<{ Bindings: CloudflareBindings }>) {
  app.use(
    "*",
    cors({
      origin: (origin, c) => {
        const allowed = c.env.CORS_ORIGIN;
        // Allow the configured origin or any localhost port during development
        if (origin === allowed || /^http:\/\/localhost:\d+$/.test(origin)) {
          return origin;
        }
        return allowed;
      },
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400,
    }),
  );
}

// Augment the global type so TypeScript knows about our bindings
declare global {
  interface CloudflareBindings {
    DB: D1Database;
    CORS_ORIGIN: string;
    ENV: string;
    JWT_SECRET: string;
  }
}
