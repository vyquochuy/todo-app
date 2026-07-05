import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sign } from "hono/jwt";
import type { RegisterSchema, LoginSchema } from "@todo-app/shared";
import type { Db } from "../db/client.js";
import { users } from "../db/schema.js";
import { AppError } from "../middleware/error-handler.js";

// ── Password Helper ──────────────────────────────────────────

/**
 * Hashes a plain password using SHA-256 and a static salt.
 * Edge-safe and runs natively in Cloudflare Workers using the Web Crypto API.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = "todo-app-salt-value-for-security";
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Service Functions ────────────────────────────────────────

export interface UserDto {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserDto;
  token: string;
}

/**
 * Registers a new user. Throws 409 if email already exists.
 */
export async function registerUser(db: Db, input: RegisterSchema): Promise<UserDto> {
  const email = input.email.toLowerCase().trim();

  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    throw new AppError(409, "Email is already registered");
  }

  const id = nanoid();
  const passwordHash = await hashPassword(input.password);
  const timestamp = new Date().toISOString();

  await db.insert(users).values({
    id,
    email,
    passwordHash,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return {
    id,
    email,
    createdAt: timestamp,
  };
}

/**
 * Authenticates user, signs and returns a JWT token.
 * Throws 401 on incorrect credentials.
 */
export async function loginUser(
  db: Db,
  input: LoginSchema,
  jwtSecret: string,
): Promise<AuthResponse> {
  const email = input.email.toLowerCase().trim();

  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  // Verify password hash
  const incomingHash = await hashPassword(input.password);
  if (user.passwordHash !== incomingHash) {
    throw new AppError(401, "Invalid email or password");
  }

  // Token expires in 7 days
  const expirationSeconds = 60 * 60 * 24 * 7;
  const payload = {
    userId: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + expirationSeconds,
  };

  const token = await sign(payload, jwtSecret);

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
}
