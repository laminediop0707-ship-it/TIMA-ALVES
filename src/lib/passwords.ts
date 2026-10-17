import { hash, verify } from "@node-rs/argon2";

/**
 * Password hashing with argon2id (memory-hard, salted, no plain text ever
 * stored). Kept in one place so the algorithm can be tuned or rotated.
 */
const HASH_OPTIONS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, HASH_OPTIONS);
}

export async function verifyPassword(
  plain: string,
  passwordHash: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, plain);
  } catch {
    return false;
  }
}

/** Minimal server-side password policy for the admin account. */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (password.length > 200) {
    return "Le mot de passe est trop long (200 caractères maximum).";
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Le mot de passe doit contenir au moins une lettre et un chiffre.";
  }
  return null;
}
