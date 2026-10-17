import { reorderMedia } from "@/lib/media";
import { jsonError, jsonOk, requireAdmin, unauthorized } from "@/lib/http";
import { reorderSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** Persists a new display order for the media library. */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) return jsonError("Ordre invalide.", 400);

  await reorderMedia(parsed.data.order);
  return jsonOk({ ok: true });
}
