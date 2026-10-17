import { createMediaFromUpload, listMedia } from "@/lib/media";
import { isImage, isVideo, saveUpload, UploadError } from "@/lib/storage";
import { jsonError, jsonOk, requireAdmin, unauthorized } from "@/lib/http";
import { MAX_UPLOAD_BYTES, env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Multi-file upload. Every file is validated server-side: size limit,
 * signature (magic bytes) and MIME type. Files are written outside /public
 * and only ever streamed back with an explicit content type.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError("Envoi invalide.", 400);

  const files = form
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) return jsonError("Aucun fichier reçu.", 400);
  if (files.length > 30) return jsonError("Maximum 30 fichiers par envoi.", 400);

  const title = String(form.get("title") ?? "");
  const caption = String(form.get("caption") ?? "");
  const alt = String(form.get("alt") ?? "");

  const created = [];
  const rejected: { name: string; reason: string }[] = [];

  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) {
      rejected.push({
        name: file.name,
        reason: `Trop lourd (max ${env.MAX_UPLOAD_SIZE_MB} Mo).`,
      });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const saved = await saveUpload(buffer);
      const type = isVideo(saved.mimeType) ? "VIDEO" : isImage(saved.mimeType) ? "IMAGE" : null;
      if (!type) {
        rejected.push({ name: file.name, reason: "Type non autorisé." });
        continue;
      }
      const media = await createMediaFromUpload(saved, {
        type,
        title: title || file.name,
        caption,
        alt,
      });
      created.push(media);
    } catch (error) {
      rejected.push({
        name: file.name,
        reason: error instanceof UploadError ? error.message : "Envoi impossible.",
      });
    }
  }

  if (created.length === 0) {
    return jsonError(
      rejected[0]?.reason ?? "Aucun fichier n'a pu être enregistré.",
      400,
      { rejected },
    );
  }

  return jsonOk({ media: created, rejected, all: await listMedia() }, { status: 201 });
}
