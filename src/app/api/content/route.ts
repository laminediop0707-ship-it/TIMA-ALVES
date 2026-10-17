import { getDraft, getPublished } from "@/lib/content";
import { buildSlideSnapshot } from "@/lib/media";
import { hasSurpriseSession, getAdminSession } from "@/lib/sessions";
import { jsonError, jsonOk } from "@/lib/http";
import type { PublishedContent } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Content for the private /surprise experience.
 *
 * - Default: the published version, only for visitors with a surprise session.
 * - `?preview=1`: the current draft (live media snapshot), for a signed-in
 *   administrator, without touching the published version.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.get("preview") === "1") {
    const admin = await getAdminSession();
    if (!admin) return jsonError("Aperçu réservé à l'administrateur.", 401);
    const draft = await getDraft();
    const slides = await buildSlideSnapshot();
    const content: PublishedContent = { ...draft, slides };
    return jsonOk({ content, preview: true });
  }

  if (!(await hasSurpriseSession())) {
    return jsonError("Surprise non déverrouillée.", 401);
  }

  const content = await getPublished();
  return jsonOk({ content });
}
