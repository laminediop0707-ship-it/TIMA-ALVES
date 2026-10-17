import { namesMatch } from "@/lib/crypto";
import { createSurpriseSession, hasSurpriseSession } from "@/lib/sessions";
import { env } from "@/lib/env";
import { clearAttempts, getLockStatus, registerFailure, RATE_LIMIT } from "@/lib/rate-limit";
import { clientIp, jsonError, jsonOk } from "@/lib/http";
import { unlockSchema } from "@/lib/validation";
import { getPublished } from "@/lib/content";

export const runtime = "nodejs";

/**
 * Playful name gate for the private space. The expected name is compared
 * server-side only — it is never shipped to the browser as an answer key.
 * This is NOT real authentication: the published content is not a secret.
 */
export async function POST(request: Request) {
  const key = `surprise:${clientIp(request)}`;
  const lock = await getLockStatus(key);
  if (lock.locked) {
    return jsonError("Doucement 😅 Réessaie dans quelques minutes.", 429, {
      retryAfterMs: lock.retryAfterMs,
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = unlockSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Écris ton nom complet 🙂", 400);
  }

  const published = await getPublished();
  const expected = env.SURPRISE_NAME || published.meta.brandName;

  if (!namesMatch(parsed.data.name, expected)) {
    const count = await registerFailure(key);
    await new Promise((resolve) => setTimeout(resolve, 350));
    return jsonError(
      "Oops girl 😭😂 Wrong name ! Try again, birthday queen.",
      401,
      { remaining: Math.max(0, RATE_LIMIT.MAX_ATTEMPTS - count) },
    );
  }

  await clearAttempts(key);
  await createSurpriseSession();
  return jsonOk({ ok: true });
}

export async function GET() {
  return jsonOk({ unlocked: await hasSurpriseSession() });
}
