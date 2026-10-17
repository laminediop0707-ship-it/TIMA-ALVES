import { prisma } from "@/lib/prisma";

/**
 * Persistent brute-force protection for the admin login.
 * Counters live in the database so a restart cannot reset them.
 */
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 minutes

export type LockStatus = { locked: boolean; retryAfterMs: number };

export async function getLockStatus(key: string): Promise<LockStatus> {
  const record = await prisma.loginAttempt.findUnique({ where: { key } });
  if (!record?.lockedUntil) return { locked: false, retryAfterMs: 0 };

  const retryAfterMs = record.lockedUntil.getTime() - Date.now();
  if (retryAfterMs <= 0) {
    await prisma.loginAttempt.deleteMany({ where: { key } });
    return { locked: false, retryAfterMs: 0 };
  }
  return { locked: true, retryAfterMs };
}

export async function registerFailure(key: string): Promise<number> {
  const record = await prisma.loginAttempt.upsert({
    where: { key },
    create: { key, count: 1 },
    update: { count: { increment: 1 } },
  });

  if (record.count >= MAX_ATTEMPTS) {
    await prisma.loginAttempt.update({
      where: { key },
      data: { lockedUntil: new Date(Date.now() + LOCK_MS) },
    });
  }
  return record.count;
}

export async function clearAttempts(key: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { key } });
}

export const RATE_LIMIT = { MAX_ATTEMPTS, LOCK_MS };
