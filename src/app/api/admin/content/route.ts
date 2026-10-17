import { getSnapshot } from "@/lib/content";
import { jsonOk, requireAdmin, unauthorized } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const snapshot = await getSnapshot();
  return jsonOk(snapshot);
}
