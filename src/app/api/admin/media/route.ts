import { createMediaFromUrl, listMedia } from "@/lib/media";
import { clientIp, jsonError, jsonOk, requireAdmin, unauthorized } from "@/lib/http";
import { mediaUrlSchema } from "@/lib/validation";
import { getLockStatus, registerFailure, clearAttempts } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  return jsonOk({ media: await listMedia() });
}

/** Adds a media entry from a remote URL. */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const key = `media:${clientIp(request)}`;
  const lock = await getLockStatus(key);
  if (lock.locked) return jsonError("Trop de requêtes. Patiente un peu.", 429);

  const body = await request.json().catch(() => null);
  const parsed = mediaUrlSchema.safeParse(body);
  if (!parsed.success) {
    await registerFailure(key);
    return jsonError("URL invalide. Utilise une adresse http(s) complète.", 400);
  }
  await clearAttempts(key);

  const media = await createMediaFromUrl(parsed.data);
  return jsonOk({ media }, { status: 201 });
}
