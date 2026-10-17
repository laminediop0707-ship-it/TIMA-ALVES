import { describe, expect, it } from "vitest";
import { contentSchema, loginSchema, mediaUrlSchema, passwordSchema } from "./validation";
import { cloneDefaultContent } from "./content-defaults";

describe("contentSchema", () => {
  it("accepts the default content", () => {
    const result = contentSchema.safeParse(cloneDefaultContent());
    expect(result.success).toBe(true);
  });

  it("rejects content missing a required section", () => {
    const broken = cloneDefaultContent() as Record<string, unknown>;
    delete broken.final;
    expect(contentSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects poems that are not an array", () => {
    const broken = cloneDefaultContent() as Record<string, unknown>;
    broken.poems = "not an array";
    expect(contentSchema.safeParse(broken).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a username and password", () => {
    expect(loginSchema.safeParse({ username: "lemzo", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ username: "", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ username: "lemzo" }).success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("enforces a minimum length", () => {
    expect(
      passwordSchema.safeParse({ currentPassword: "a", newPassword: "short" }).success,
    ).toBe(false);
    expect(
      passwordSchema.safeParse({ currentPassword: "a", newPassword: "longenough1" }).success,
    ).toBe(true);
  });
});

describe("mediaUrlSchema", () => {
  it("accepts http(s) urls only", () => {
    expect(
      mediaUrlSchema.safeParse({ type: "IMAGE", url: "https://example.com/a.jpg" }).success,
    ).toBe(true);
    expect(
      mediaUrlSchema.safeParse({ type: "IMAGE", url: "javascript:alert(1)" }).success,
    ).toBe(false);
  });
});
