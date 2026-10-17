import { destroyAdminSession } from "@/lib/sessions";
import { jsonOk } from "@/lib/http";

export const runtime = "nodejs";

export async function POST() {
  await destroyAdminSession();
  return jsonOk({ ok: true });
}
