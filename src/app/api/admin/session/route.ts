import { requireAdmin } from "@/lib/http";
import { jsonOk, unauthorized } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  return jsonOk({ user: admin });
}
