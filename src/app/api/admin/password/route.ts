import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/passwords";
import { createAdminSession, revokeAllSessions } from "@/lib/sessions";
import { jsonError, jsonOk, requireAdmin, unauthorized } from "@/lib/http";
import { passwordSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Requête invalide.", 400);
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.adminUser.findUnique({ where: { id: admin.id } });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return jsonError("Mot de passe actuel incorrect.", 401);
  }

  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) return jsonError(strengthError, 400);

  if (await verifyPassword(newPassword, user.passwordHash)) {
    return jsonError("Le nouveau mot de passe doit être différent de l'ancien.", 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  // Invalidate every existing session, then keep the current tab signed in.
  await revokeAllSessions(user.id);
  await createAdminSession(user.id);

  return jsonOk({ ok: true });
}
