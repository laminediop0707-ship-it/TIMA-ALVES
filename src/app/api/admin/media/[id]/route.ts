import { softDeleteMedia, updateMedia } from "@/lib/media";
import { jsonError, jsonOk, requireAdmin, unauthorized } from "@/lib/http";
import { mediaUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = mediaUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Données invalides.", 400);

  const media = await updateMedia(id, parsed.data);
  if (!media) return jsonError("Média introuvable.", 404);
  return jsonOk({ media });
}

export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const { id } = await params;
  const removed = await softDeleteMedia(id);
  if (!removed) return jsonError("Média introuvable.", 404);
  return jsonOk({ ok: true });
}
