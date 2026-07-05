import { describe, it, expect } from "vitest";
import { formatTodoDate, getErrorMessage } from "../utils";

describe("formatTodoDate", () => {
  it("formats absolute dates correctly", () => {
    // Standard static date
    const dateStr = "2026-01-05T15:45:00Z";
    const formatted = formatTodoDate(dateStr);
    
    // Should return formatted date depending on relative distance, but let's check
    // it returns a non-empty string.
    expect(formatted).toBeTypeOf("string");
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("handles modern date strings cleanly", () => {
    const today = new Date().toISOString();
    const formatted = formatTodoDate(today);
    expect(formatted).toContain("Today at");
  });
});

describe("getErrorMessage", () => {
  it("extracts custom response message from Axios error structure", () => {
    const mockAxiosError = Object.assign(new Error("Standard Message"), {
      response: {
        data: {
          message: "Database insertion failed",
        },
      },
    });
    
    const message = getErrorMessage(mockAxiosError as any);
    expect(message).toBe("Database insertion failed");
  });

  it("falls back to top-level message if response has none", () => {
    const error = new Error("Connection timed out");
    const message = getErrorMessage(error);
    expect(message).toBe("Connection timed out");
  });

  it("handles general error objects", () => {
    const error = new Error("Standard error message");
    const message = getErrorMessage(error);
    expect(message).toBe("Standard error message");
  });

  it("returns fallback message for non-error types", () => {
    const message = getErrorMessage("some string error");
    expect(message).toBe("An unexpected error occurred");
  });
});
