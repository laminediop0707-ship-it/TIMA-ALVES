import { discardDraft, restoreRevision } from "@/lib/content";
import { jsonError, jsonOk, requireAdmin, unauthorized } from "@/lib/http";

export const runtime = "nodejs";

/** Cancels pending edits: restores the draft from the published version. */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const body = (await request.json().catch(() => null)) as { revisionId?: string } | null;

  if (body?.revisionId) {
    const content = await restoreRevision(body.revisionId);
    if (!content) return jsonError("Version introuvable.", 404);
    return jsonOk({ ok: true, content, restored: true });
  }

  const content = await discardDraft();
  return jsonOk({ ok: true, content });
}
