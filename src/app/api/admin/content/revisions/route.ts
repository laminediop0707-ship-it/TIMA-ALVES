import { listRevisions } from "@/lib/content";
import { jsonOk, requireAdmin, unauthorized } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Published history (most recent first). */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  return jsonOk({ revisions: await listRevisions() });
}
