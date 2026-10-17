import { createHash, randomBytes } from "node:crypto";

/** SHA-256 hex digest, used to store session tokens without keeping the secret. */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Cryptographically strong opaque token for the session cookie. */
export function newToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Normalises a typed full name for comparison: NFC, lower case, trimmed,
 * accents folded and internal whitespace collapsed. Being forgiving on accents
 * and case keeps the playful gate pleasant while still rejecting a different
 * name entirely.
 */
export function normalizeName(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function namesMatch(input: string, expected: string): boolean {
  return normalizeName(input) === normalizeName(expected);
}
