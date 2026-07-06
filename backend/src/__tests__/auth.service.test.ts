import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../services/auth.service";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function legacyHashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password}todo-app-salt-value-for-security`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

describe("password hashing", () => {
  it("returns the PBKDF2 storage format", async () => {
    const storedHash = await hashPassword("password123");
    const parts = storedHash.split(":");

    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("pbkdf2");
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/);
    expect(parts[2]).toMatch(/^[0-9a-f]{64}$/);
  });

  it("uses a different salt for the same password", async () => {
    const firstHash = await hashPassword("password123");
    const secondHash = await hashPassword("password123");

    expect(firstHash).not.toBe(secondHash);
  });

  it("verifies the right password", async () => {
    const storedHash = await hashPassword("password123");

    await expect(verifyPassword("password123", storedHash)).resolves.toBe(true);
  });

  it("rejects the wrong password", async () => {
    const storedHash = await hashPassword("password123");

    await expect(verifyPassword("wrong-password", storedHash)).resolves.toBe(
      false,
    );
  });

  it("supports legacy SHA-256 hashes during migration", async () => {
    const legacyHash = await legacyHashPassword("password123");

    await expect(verifyPassword("password123", legacyHash)).resolves.toBe(true);
  });
});
