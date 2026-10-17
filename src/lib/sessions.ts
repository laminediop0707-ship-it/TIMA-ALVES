import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { newToken, sha256 } from "@/lib/crypto";
import {
  ADMIN_SESSION_TTL_MS,
  SESSION_COOKIE,
  SURPRISE_COOKIE,
  SURPRISE_SESSION_TTL_MS,
  env,
} from "@/lib/env";

const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.SESSION_COOKIE_SECURE,
  path: "/",
};

/* ------------------------------------------------------------------ */
/*  Administrator sessions                                             */
/* ------------------------------------------------------------------ */

export async function createAdminSession(userId: string): Promise<void> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);

  await prisma.session.create({
    data: { tokenHash: sha256(token), userId, expiresAt },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    ...baseCookie,
    expires: expiresAt,
  });
}

export type AdminSessionUser = {
  id: string;
  username: string;
  mustChangePassword: boolean;
};

export async function getAdminSession(): Promise<AdminSessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.username,
    mustChangePassword: session.user.mustChangePassword,
  };
}

/** Removes the current admin session (DB row + cookie). */
export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: sha256(token) } })
      .catch(() => {});
  }
  store.delete(SESSION_COOKIE);
}

/** Invalidate every session of a user (used after a password change). */
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

/* ------------------------------------------------------------------ */
/*  Surprise ("birthday girl") sessions                                */
/* ------------------------------------------------------------------ */

export async function createSurpriseSession(): Promise<void> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SURPRISE_SESSION_TTL_MS);

  await prisma.surpriseSession.create({
    data: { tokenHash: sha256(token), expiresAt },
  });

  const store = await cookies();
  store.set(SURPRISE_COOKIE, token, { ...baseCookie, expires: expiresAt });
}

export async function hasSurpriseSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SURPRISE_COOKIE)?.value;
  if (!token) return false;

  const session = await prisma.surpriseSession.findUnique({
    where: { tokenHash: sha256(token) },
  });
  if (!session) return false;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.surpriseSession
      .delete({ where: { id: session.id } })
      .catch(() => {});
    return false;
  }
  return true;
}

export async function destroySurpriseSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SURPRISE_COOKIE)?.value;
  if (token) {
    await prisma.surpriseSession
      .deleteMany({ where: { tokenHash: sha256(token) } })
      .catch(() => {});
  }
  store.delete(SURPRISE_COOKIE);
}
