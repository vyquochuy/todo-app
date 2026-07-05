import { describe, it, expect } from "vitest";
import { buildPaginationMeta } from "../../src/utils/response";
import { AppError } from "../../src/middleware/error-handler";

// ── Unit tests: response utilities ───────────────────────────

describe("buildPaginationMeta", () => {
  it("calculates totalPages correctly", () => {
    const meta = buildPaginationMeta(87, 1, 10);
    expect(meta.totalPages).toBe(9);
  });

  it("sets hasNext=true when not on last page", () => {
    const meta = buildPaginationMeta(50, 1, 10);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrevious).toBe(false);
  });

  it("sets hasPrevious=true on page 2+", () => {
    const meta = buildPaginationMeta(50, 2, 10);
    expect(meta.hasPrevious).toBe(true);
  });

  it("sets hasNext=false on last page", () => {
    const meta = buildPaginationMeta(20, 2, 10);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrevious).toBe(true);
  });

  it("handles exactly one page", () => {
    const meta = buildPaginationMeta(5, 1, 10);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrevious).toBe(false);
  });

  it("handles empty result", () => {
    const meta = buildPaginationMeta(0, 1, 10);
    expect(meta.total).toBe(0);
    expect(meta.totalPages).toBe(0);
  });
});

// ── Unit tests: AppError ──────────────────────────────────────

describe("AppError", () => {
  it("stores the status code and message", () => {
    const err = new AppError(404, "Not found");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err).toBeInstanceOf(Error);
  });

  it("has name AppError", () => {
    const err = new AppError(500, "Server error");
    expect(err.name).toBe("AppError");
  });
});
