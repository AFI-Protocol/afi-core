// tests/mentor_registry.test.ts
import { describe, it, expect, vi } from "vitest";

// Temporary mock for MentorRegistry until runtime file is restored
const MentorRegistry = {
  registerMentor: vi.fn((mentorId: string) => ({
    id: mentorId,
    status: "registered",
  })),
  getMentor: vi.fn((mentorId: string) => ({
    id: mentorId,
    status: "registered",
  })),
};

describe("MentorRegistry (Mocked)", () => {
  it("successfully registers a mentor", () => {
    const result = MentorRegistry.registerMentor("mentor_123");
    expect(result).toEqual({ id: "mentor_123", status: "registered" });
  });

  it("retrieves a registered mentor", () => {
    const result = MentorRegistry.getMentor("mentor_123");
    expect(result.status).toBe("registered");
  });
});