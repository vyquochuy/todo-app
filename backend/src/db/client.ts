import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema.js";

/**
 * Creates a Drizzle ORM client bound to the Cloudflare D1 database.
 *
 * The D1 database is injected via the `DB` binding defined in wrangler.toml.
 * We create a new client per request as Workers are stateless.
 *
 * @param d1 - The D1 database binding from the Worker environment
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema, logger: false });
}

export type Db = ReturnType<typeof createDb>;
