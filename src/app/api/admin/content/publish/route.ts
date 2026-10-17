import { publishDraft } from "@/lib/content";
import { jsonError, jsonOk, requireAdmin, unauthorized } from "@/lib/http";

export const runtime = "nodejs";

/** Confirms and publishes: the draft + media library become the live site. */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  try {
    const published = await publishDraft();
    return jsonOk({ ok: true, publishedAt: new Date().toISOString(), published });
  } catch {
    return jsonError("Publication impossible. Vérifie le contenu puis réessaie.", 500);
  }
}
