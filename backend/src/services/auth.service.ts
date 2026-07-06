import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sign } from "hono/jwt";
import type { RegisterSchema, LoginSchema } from "@todo-app/shared";
import type { Db } from "../db/client.js";
import { users } from "../db/schema.js";
import { AppError } from "../middleware/error-handler.js";

const PBKDF2_PREFIX = "pbkdf2";
const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const DERIVED_KEY_BITS = 256;
const LEGACY_SALT = "todo-app-salt-value-for-security";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16);
  }
  return bytes;
}

async function derivePbkdf2Hash(
  password: string,
  salt: Uint8Array,
): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    DERIVED_KEY_BITS,
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

async function legacyHashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + LEGACY_SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

export function isPbkdf2Hash(storedHash: string): boolean {
  return storedHash.startsWith(`${PBKDF2_PREFIX}:`);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hashHex = await derivePbkdf2Hash(password, salt);
  return `${PBKDF2_PREFIX}:${bytesToHex(salt)}:${hashHex}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  if (isPbkdf2Hash(storedHash)) {
    const [, saltHex, hashHex] = storedHash.split(":");
    if (!saltHex || !hashHex) return false;

    try {
      const actualHash = await derivePbkdf2Hash(password, hexToBytes(saltHex));
      return actualHash === hashHex;
    } catch {
      return false;
    }
  }

  return (await legacyHashPassword(password)) === storedHash;
}

export interface UserDto {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserDto;
  token: string;
}

export async function registerUser(db: Db, input: RegisterSchema): Promise<UserDto> {
  const email = input.email.toLowerCase().trim();

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

export async function loginUser(
  db: Db,
  input: LoginSchema,
  jwtSecret: string,
): Promise<AuthResponse> {
  const email = input.email.toLowerCase().trim();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, "Invalid email or password");
  }

  if (!isPbkdf2Hash(user.passwordHash)) {
    await db
      .update(users)
      .set({
        passwordHash: await hashPassword(input.password),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));
  }

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
