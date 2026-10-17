import { describe, expect, it } from "vitest";
import { namesMatch, normalizeName, sha256, newToken } from "./crypto";

describe("normalizeName", () => {
  it("lowercases, trims and collapses spaces", () => {
    expect(normalizeName("  Estère   Adousinda  Alves ")).toBe(
      "estere adousinda alves",
    );
  });

  it("folds accents", () => {
    expect(normalizeName("ESTÈRE")).toBe("estere");
  });
});

describe("namesMatch", () => {
  const expected = "Estère Adousinda Alves";

  it("accepts the exact name", () => {
    expect(namesMatch("Estère Adousinda Alves", expected)).toBe(true);
  });

  it("accepts extra spaces, different case and missing accents", () => {
    expect(namesMatch("  estere   adousinda   ALVES ", expected)).toBe(true);
  });

  it("rejects a wrong first name", () => {
    expect(namesMatch("Tima Alves", expected)).toBe(false);
  });

  it("rejects a partial name", () => {
    expect(namesMatch("Estère", expected)).toBe(false);
  });

  it("rejects an empty answer", () => {
    expect(namesMatch("", expected)).toBe(false);
  });
});

describe("tokens", () => {
  it("hashes deterministically", () => {
    expect(sha256("hello")).toBe(sha256("hello"));
    expect(sha256("hello")).not.toBe(sha256("hellp"));
  });

  it("generates unique 64-char tokens", () => {
    const a = newToken();
    const b = newToken();
    expect(a).toHaveLength(64);
    expect(a).not.toBe(b);
  });
});
