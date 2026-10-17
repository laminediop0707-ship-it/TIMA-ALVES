import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/passwords";
import { createAdminSession } from "@/lib/sessions";
import { clearAttempts, getLockStatus, registerFailure, RATE_LIMIT } from "@/lib/rate-limit";
import { clientIp, jsonError, jsonOk } from "@/lib/http";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Requête invalide.", 400);
  }

  const { username, password } = parsed.data;
  const ip = clientIp(request);

  const lock = await getLockStatus(`ip:${ip}`);
  if (lock.locked) {
    return jsonError("Trop de tentatives. Réessaie dans quelques minutes.", 429, {
      retryAfterMs: lock.retryAfterMs,
    });
  }

  const user = await prisma.adminUser.findUnique({ where: { username } });
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid) {
    const count = await registerFailure(`ip:${ip}`);
    // Small delay to slow down automated guessing.
    await new Promise((resolve) => setTimeout(resolve, 400));
    return jsonError("Identifiant ou mot de passe incorrect.", 401, {
      remaining: Math.max(0, RATE_LIMIT.MAX_ATTEMPTS - count),
    });
  }

  await clearAttempts(`ip:${ip}`);
  await createAdminSession(user.id);
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return jsonOk({ ok: true, mustChangePassword: user.mustChangePassword });
}
